'use strict';

require('./index.html');
const {Elm} = require('./Main.elm');

Elm.Main.init({node: document.getElementById('main')});
