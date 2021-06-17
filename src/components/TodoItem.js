import React from 'react'
import PropTypes from 'prop-types'
import withObservables from '@nozbe/with-observables'
// import { StyleSheet } from 'react-native'
import { List, IconButton } from 'react-native-paper'
import Icon from 'react-native-vector-icons/dist/MaterialCommunityIcons'

const IconSync = ({ color }) => (
  <List.Icon color={color} icon={({ color }) => <Icon name="cloud-sync" size={18} color={color} />} />
)

IconSync.propTypes = {
  color: PropTypes.string.isRequired
}

const TodoItem = ({ todo, handleEdit, handleDelte }) => {
  return (
    <List.Item
      title={todo.title}
      description={todo.description}
      left={() => <IconSync color={todo.sync ? 'green' : 'red'} />}
      right={() =>
        <>
          <IconButton icon="circle-edit-outline" onPress={handleEdit} />
          <IconButton icon="delete" onPress={handleDelte} />
        </>
      }
    />
  )
}

TodoItem.propTypes = {
  todo: PropTypes.object.isRequired,
  handleEdit: PropTypes.func.isRequired,
  handleDelte: PropTypes.func.isRequired
}

const enhance = withObservables(['todo'], ({ todo }) => ({
  todo: todo.observe()
}))

export default enhance(TodoItem)

// const styles = StyleSheet.create({
//   icon: {
//     width: 10, height: 10, borderWidth: 1, borderRadius: 10
//   }
// })
