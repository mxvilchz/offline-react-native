/* eslint-disable prettier/prettier */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const HomeScreen = ({ navigation }) => {

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => ()
    })
  }, [navigation])

  return (
    <View>
      <Text>Home</Text>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
