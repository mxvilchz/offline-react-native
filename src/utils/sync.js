/* eslint-disable array-callback-return */
import { Q } from '@nozbe/watermelondb'
import { database } from '../models'
import RNFetchBlob from 'rn-fetch-blob'
import { PermissionsAndroid, Platform } from 'react-native'
// import { times } from 'rambdax'
import RnBgTask from 'react-native-bg-thread'

export const pull = async () => {
  try {
    const fetchTimestamp = await database.collections.get('timestamps').query(
      Q.experimentalTake(1)
    ).fetch()

    await RNFetchBlob.fetch('GET', `http://prueba.navego360.com/index.php/sync/get?uxtime=${fetchTimestamp.length > 0 ? fetchTimestamp[0].timestamp : 0}`)
      .then(async response => {
        const status = response.info().status
        if (status === 200) {
          const json = await response.json()
          const data = await json.data

          if (data.update.length > 0) {
            const dirs = RNFetchBlob.fs.dirs
            const count = data.update.length
            const uuidToUpdate = []
            const arrToUpdate = []
            const todosToCreate = []

            const arrImages = []

            database.action(async () => {
              const collection = database.collections.get('todos')

              for (let i = 0; i < count; i++) {
                const uuid = data.update[i].uid
                const fetchTodo = await database.collections.get('todos').query(Q.where('uuid', uuid)).fetch()
                const toUpdate = data.update.find(item => item.uid === uuid)
                const formId = toUpdate.form_id
                const { title, description, state, image } = JSON.parse(toUpdate.efs)
                let path = ''
                if (image !== '' && image !== null) {
                  path = dirs.DownloadDir + '/' + image
                  arrImages.push(image)
                }

                if (fetchTodo.length > 0) {
                  arrToUpdate.push({ uuid, title, description, state, image, formId, path })
                  uuidToUpdate.push(uuid)
                } else {
                  todosToCreate.push({ uuid, title, description, state, image, formId, path })
                }
              }

              const todosToUpdate = await database.collections.get('todos').query(Q.where('uuid', Q.oneOf(uuidToUpdate))).fetch()

              await database.batch(
                ...todosToUpdate.map((todo, i) => todo.prepareUpdate(() => {
                  todo.title = arrToUpdate[i].title
                  todo.description = arrToUpdate[i].description
                  todo.state = arrToUpdate[i].state
                  todo.meta = { fileName: arrToUpdate[i].image, uri: Platform.OS === 'android' ? 'file://' + arrToUpdate[i].path : '' + arrToUpdate[i].path }
                  todo.sync = true
                })),
                ...todosToCreate.map((item, i) => collection.prepareCreate((todo) => {
                  todo.uuid = item.uuid
                  todo.title = item.title
                  todo.description = item.description
                  todo.state = item.state
                  todo.meta = { fileName: item.image, uri: Platform.OS === 'android' ? 'file://' + item.path : '' + item.path }
                  todo.sync = true
                  todo.status = 1
                }))
              )
            })

            RnBgTask.runInBackground_withPriority('NORMAL', () => download(arrImages))
          }

          if (data.delete.length > 0) {
            const uuidToDelete = []
            const count = data.delete.length

            database.action(async () => {
              for (let i = 0; i < count; i++) {
                const uuid = data.delete[i].uid
                const fetchTodo = await database.collections.get('todos').query(Q.where('uuid', uuid)).fetch()
                if (fetchTodo.length > 0) {
                  uuidToDelete.push(uuid)
                }
              }

              const todosToDelete = await database.collections.get('todos').query(Q.where('uuid', Q.oneOf(uuidToDelete))).fetch()
              await database.batch(
                ...todosToDelete.map((todo, i) => todo.prepareUpdate(() => {
                  todo.status = 0
                  todo.sync = true
                }))
              )
            })
          }

          if (fetchTimestamp.length > 0) {
            const id = fetchTimestamp[0].id
            const timestamp = await database.collections.get('timestamps').find(id)
            await database.action(async () => {
              await timestamp.update(item => {
                item.timestamp = Number(data.uxtime)
              })
            })
          } else {
            await database.action(async () => {
              await database.collections.get('timestamps').create(item => {
                item.timestamp = Number(data.uxtime)
              })
            })
          }
        }
      }).catch((error) => {
        console.log(error)
      })
  } catch (error) {
    console.log(error)
  }
  return Promise.resolve(null)
}

export const push = async () => {
  try {
    const fetchCount = await database.collections.get('todos').query(
      Q.where('status', 0),
      Q.where('sync', false)
    ).fetchCount()

    if (fetchCount > 0) {
      const uuids = []
      const fetchDeleted = await database.collections.get('todos').query(
        Q.where('status', 0),
        Q.where('sync', false)
      ).fetch()

      fetchDeleted.map(item => {
        uuids.push(item.uuid)
      })

      await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/delete', {
        'Content-Type': 'multipart/form-data'
      }, [
        {
          name: 'delete',
          data: JSON.stringify({
            delete: uuids
          })
        }
      ]).then(async response => {
        const status = response.info().status
        if (status === 200) {
          const data = await response.json()

          for (let i = 0; i < data.delete.length; i++) {
            const uuid = data.delete[i]
            const countDeleted = await database.collections.get('todos').query(Q.where('uuid', uuid)).fetchCount()
            if (countDeleted > 0) {
              const deleted = await database.collections.get('todos').query(Q.where('uuid', uuid)).fetch()
              const obj = deleted.find(item => item.uuid === uuid)
              const todo = await database.collections.get('todos').find(obj.id)
              await database.action(async () => {
                await todo.markAsDeleted()
                await todo.destroyPermanently()
              })
            } else {
              console.log('not found for delete')
            }
          }
        }
      }).catch((error) => {
        console.log(error)
      })
    }

    const fetchTodo = await database.collections.get('todos').query(
      Q.where('sync', false),
      Q.where('status', 1),
      Q.experimentalTake(1)
    ).fetch()

    if (fetchTodo.length > 0) {
      const obj = fetchTodo[0]
      await RNFetchBlob.fetch('POST', 'http://prueba.navego360.com/index.php/sync/save', {
        'Content-Type': 'multipart/form-data'
      }, [
        {
          name: 'files.file',
          filename: fetchTodo[0].meta?.fileName,
          data: RNFetchBlob.wrap(fetchTodo[0].meta?.uri)
        },
        {
          name: 'task',
          data: JSON.stringify({
            title: obj.title,
            description: obj.description,
            state: obj.state
          })
        },
        {
          name: 'uid',
          data: obj.uuid
        }
      ]).then(async response => {
        const status = response.info().status
        if (status === 200) {
          const todo = await database.collections.get('todos').find(obj.id)
          await database.action(async () => {
            todo.update(item => {
              item.sync = true
            })
          })
        }
      }).catch((error) => {
        console.log(error)
      })
    }
  } catch (error) {
    console.log(error)
  }
  return Promise.resolve(null)
}

const download = async (arr = []) => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Permiso para descargar archivos',
        message: 'Se necesita permiso para descargar archivos',
        buttonNeutral: 'Pregúntame Luego',
        buttonNegative: 'Cancelar',
        buttonPositive: 'OK'
      }
    )
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      const dirs = RNFetchBlob.fs.dirs
      for (let i = 0; i < arr.length; i++) {
        const image = arr[i]
        await RNFetchBlob
          .config({
            fileCache: true,
            path: dirs.DownloadDir + '/' + image,
            addAndroidDownloads: {
              path: dirs.DownloadDir + '/' + image,
              useDownloadManager: true, // <-- this is the only thing required
              // Optional, override notification setting (default to true)
              notification: false,
              // Optional, but recommended since android DownloadManager will fail when
              // the url does not contains a file extension, by default the mime type will be text/plain
              mime: '/',
              description: 'File downloaded by download manager.'
            }
          })
          .fetch('GET', `https://prueba.navego360.com/upload/${image}`)
          .then(async res => {
            console.log(res.path())
          })
          .catch((errorMessage) => {
            console.log(1, errorMessage)
          })
      }
    }
  } catch (err) {
    console.warn(err)
  }
}
