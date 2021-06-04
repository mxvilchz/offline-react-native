/* eslint-disable prettier/prettier */

import { AppRegistry } from 'react-native';
import App from './App';
import './src/models/index';

import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
