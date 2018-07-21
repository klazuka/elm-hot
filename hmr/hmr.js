//////////////////// HMR BEGIN ////////////////////

/*
  MIT License http://www.opensource.org/licenses/mit-license.php
  Original Author: Flux Xu @fluxxu
*/

// TODO [kl] only enable HMR when user opts-in
var useHMR = true;

if (useHMR) {
    (function(jsModule) {
        "use strict";

        var version = detectElmVersion()
        console.log('[elm-hot] Elm version:', version)

        if (version === '0.17') {
            throw new Error('[elm-hot] Please use fluxxu/elm-hot-loader@0.4.x')
        } else if (version === '0.18') {
            throw new Error('[elm-hot] Please use fluxxu/elm-hot-loader@0.5.x')
        } else if (version !== '0.19') {
            throw new Error('[elm-hot] Elm version not supported.')
        }

        //polyfill for IE: https://github.com/fluxxu/elm-hot-loader/issues/16
        if (typeof Object.assign != 'function') {
            Object.assign = function(target) {
                'use strict';
                if (target == null) {
                    throw new TypeError('Cannot convert undefined or null to object');
                }

                target = Object(target);
                for (var index = 1; index < arguments.length; index++) {
                    var source = arguments[index];
                    if (source != null) {
                        for (var key in source) {
                            if (Object.prototype.hasOwnProperty.call(source, key)) {
                                target[key] = source[key];
                            }
                        }
                    }
                }
                return target;
            };
        }


        var instances = jsModule.hot.data
            ? jsModule.hot.data.instances || {}
            : {};
        var uid = jsModule.hot.data
            ? jsModule.hot.data.uid || 0
            : 0;

        console.log("current uid is " + uid + " instances is " + JSON.stringify(instances))

        var cancellers = [];

        // These 2 variables act as dynamically-scoped variables which are set only when the
        // Elm module's hooked init function is called.
        var initializingInstance = null;
        var swappingInstance = null;

        jsModule.hot.accept();
        jsModule.hot.dispose(function(data) {
            console.log("running the callback given to dispose")
            data.instances = instances;
            data.uid = uid;

            // disable current instance
            // TODO [kl] fix this
            // _elm_lang$core$Native_Scheduler.nativeBinding = function() {
            //     return _elm_lang$core$Native_Scheduler.fail(new Error('[elm-hot] Inactive Elm instance.'))
            // }

            if (cancellers.length) {
                console.log('[elm-hot] Killing ' + cancellers.length + ' running processes...');
                try {
                    cancellers.forEach(function (cancel) {
                        cancel();
                    });
                } catch (e) {
                    console.warn('[elm-hot] Kill process error: ' + e.message);
                }
            }
        });

        function getId() {
            return ++uid;
        }

        function detectElmVersion() {
            try {
                if (_Platform_initialize) {
                    return '0.19'
                }
            } catch (_) {}

            try {
                if (_elm_lang$core$Native_Platform.initialize) {
                    return '0.18'
                }
            } catch (_) {}

            try {
                // 0.17 function programWithFlags(details)
                if (_elm_lang$virtual_dom$VirtualDom$programWithFlags.length === 1) {
                    return '0.17'
                }
            } catch (_) {}

            return 'unknown'
        }

        function findPublicModules(parent, path) {
            var modules = [];
            for (var key in parent) {
                var child = parent[key];
                var currentPath = path ? path + '.' + key : key;
                if ('init' in child) {
                    modules.push({
                        path: currentPath,
                        module: child
                    });
                } else {
                    modules = modules.concat(findPublicModules(child, currentPath));
                }
            }
            return modules;
        }

        function getPublicModule(Elm, path) {
            var parts = path.split('.');
            var parent = Elm;
            for (var i = 0; i < parts.length; ++i) {
                var part = parts[i];
                if (part in parent) {
                    parent = parent[part]
                }
                if (!parent) {
                    return null;
                }
            }
            return parent
        }

        function registerInstance(domNode, flags, path, portSubscribes) {
            var id = getId();

            var instance = {
                id: id,
                path: path,
                domNode: domNode,
                flags: flags,
                portSubscribes: portSubscribes,
                elmProxy: null,
                lastState: null, // last elm app state
                callbacks: []
            }

            instance.subscribe = function (cb) {
                instance.callbacks.push(cb)
                return function () {
                    instance.callbacks.splice(instance.callbacks.indexOf(cb), 1)
                }
            }

            instance.dispatch = function (event) {
                instance.callbacks.forEach(function (cb) {
                    cb(event, {
                        flags: instance.flags,
                        state: '_0' in instance.lastState
                            ? instance.lastState._0 //debugger state
                            : instance.lastState //normal state
                    })
                })
            }

            console.log("Registering instance: " + JSON.stringify(instance) + " for id " + id)
            return instances[id] = instance
        }

        function wrapPublicModule(path, module) {
            var originalInit = module.init;
            if (originalInit) {
                module.init = function(args) {
                    console.log("JS init of Elm module '" + path + "' invoked")
                    var elm;
                    var portSubscribes = {};

                    // TODO [kl] reconsider how we detect whether we are embedding or going fullscreen.
                    var domNode = args['node'] || document.body;

                    initializingInstance = registerInstance(domNode, args['flags'], path, portSubscribes)
                    elm = originalInit(args);
                    wrapPorts(elm, portSubscribes)
                    elm = initializingInstance.elmProxy = {
                        ports: elm.ports,
                        hot: {
                            subscribe: initializingInstance.subscribe
                        }
                    };
                    initializingInstance = null;
                    return elm;
                };
            } else {
                console.error("Could not find a public module to wrap at path " + path)
            }
        }

        function swap(Elm, instance) {
            console.log('[elm-hot] Hot-swapping module: ' + instance.path)

            swappingInstance = instance;

            var domNode = instance.domNode;

            while (domNode.lastChild) {
                domNode.removeChild(domNode.lastChild);
            }

            var m = getPublicModule(Elm, instance.path)
            var elm;
            if (m) {
                instance.dispatch('swap') // TODO [kl] does this do anything???

                var flags = instance.flags
                // TODO [kl] fluxxu used to handle fullscreen init differently here, but I think that has changed in 0.19 rc1
                elm = m.init({node: domNode, flags: flags});
                console.log("Swap finished JS init of Elm model")

                instance.elmProxy.ports = elm.ports;

                Object.keys(instance.portSubscribes).forEach(function(portName) {
                    if (portName in elm.ports && 'subscribe' in elm.ports[portName]) {
                        var handlers = instance.portSubscribes[portName];
                        if (!handlers.length) {
                            return;
                        }
                        console.log('[elm-hot] Reconnect ' + handlers.length + ' handler(s) to port \''
                            + portName + '\' (' + instance.path + ').');
                        handlers.forEach(function(handler) {
                            elm.ports[portName].subscribe(handler);
                        });
                    } else {
                        delete instance.portSubscribes[portName];
                        console.log('[elm-hot] Port was removed: ' + portName);
                    }
                });
            } else {
                console.log('[elm-hot] Module was removed: ' + instance.path);
            }

            swappingInstance = null;
        }

        function wrapPorts(elm, portSubscribes) {
            var portNames = Object.keys(elm.ports || {});
            //hook ports
            if (portNames.length) {
                portNames
                    .filter(function(name) {
                        return 'subscribe' in elm.ports[name];
                    })
                    .forEach(function(portName) {
                        var port = elm.ports[portName];
                        var subscribe = port.subscribe;
                        var unsubscribe = port.unsubscribe;
                        elm.ports[portName] = Object.assign(port, {
                            subscribe: function(handler) {
                                console.log('[elm-hot] ports.' + portName + '.subscribe called.');
                                if (!portSubscribes[portName]) {
                                    portSubscribes[portName] = [ handler ];
                                } else {
                                    //TODO handle subscribing to single handler more than once?
                                    portSubscribes[portName].push(handler);
                                }
                                return subscribe.call(port, handler);
                            },
                            unsubscribe: function(handler) {
                                console.log('[elm-hot] ports.' + portName + '.unsubscribe called.');
                                var list = portSubscribes[portName];
                                if (list && list.indexOf(handler) !== -1) {
                                    list.splice(list.lastIndexOf(handler), 1);
                                } else {
                                    console.warn('[elm-hot] ports.' + portName + '.unsubscribe: handler not subscribed');
                                }
                                return unsubscribe.call(port, handler);
                            }
                        });
                    });
            }
            return portSubscribes;
        }

        function findNavKey(model) {
            for (var key in model) {
                if (model.hasOwnProperty(key)) {
                    var value = model[key];
                    // TODO [kl] talk to Evan about a better way to find this data in the model
                    if (key === "myNavKey") {
                        return {value: value, path: key};
                    }
                    // if (typeof value === "object" && "$HMR$" in value) {
                    //     return {value: value, path: key};
                    // }
                }
            }
            return null;
        }

        // hook program creation
        var initialize = _Platform_initialize
        _Platform_initialize = function (flagDecoder, args, init, update, subscriptions, stepperBuilder) {
            if (initializingInstance !== null && swappingInstance === null)
                console.log("Initializing Elm module; initializingInstance=" + JSON.stringify(initializingInstance));
            else if (initializingInstance === null && swappingInstance !== null)
                console.log("Re-initializing Elm module during swap; swappingInstance=" + JSON.stringify(swappingInstance));
            else
                throw Error("Unexpected state: initializingInstance=" + initializingInstance
                    + " swappingInstance=" + swappingInstance);
            var instance = initializingInstance
            var swapping = swappingInstance
            var tryFirstRender = !!swappingInstance

            var hookedInit = function (args) {
                console.log("hooked Elm init called")
                var initialStateTuple = init(args)
                if (swappingInstance) {
                    console.log("hot swapping state using previous model=" + JSON.stringify(swappingInstance.lastState))
                    // the heart of the app state hot-swap
                    var newNavKeyLoc = findNavKey(initialStateTuple.a);
                    initialStateTuple.a = swappingInstance.lastState
                    if (newNavKeyLoc !== null) {
                        // TODO [kl] handle nav keys that are deeply nested in the model
                        console.log("Replacing the Browser.Navigation.Key in the model");
                        initialStateTuple.a[newNavKeyLoc.path] = newNavKeyLoc.value;
                    }
                }
                return initialStateTuple
            }

            var hookedStepperBuilder = function (sendToApp, model) {
                console.log("hookedStepperBuilder() invoked with initial model=" + JSON.stringify(model))
                var result;
                // first render may fail if shape of model changed too much
                if (tryFirstRender) {
                    tryFirstRender = false
                    try {
                        // TODO [kl] verify that this try-catch is actually still useful in Elm 0.19
                        result = stepperBuilder(sendToApp, model)
                    } catch (e) {
                        throw new Error('[elm-hot] Hot-swapping is not possible, please reload page. Error: ' + e.message)
                    }
                } else {
                    result = stepperBuilder(sendToApp, model)
                }

                return function(nextModel, isSync) {
                    console.log("hooked stepper invoked with nextModel=" + JSON.stringify(nextModel));
                    if (instance) {
                        // capture the state after every step so that later we can restore from it during a hot-swap
                        console.log("Setting lastState on the current initializing instance");
                        instance.lastState = nextModel
                    } else if (swapping) {
                        // capture the state after every step so that later we can restore from it during a hot-swap
                        // TODO [kl] why did I have to add this case? maybe something about how the Elm stepper is setup now?
                        console.log("Setting lastState on the current swapping instance");
                        swapping.lastState = nextModel
                    } else {
                        throw Error("Should never happen: no instance to set lastState on!");
                    }
                    return result(nextModel, isSync)
                }
            };

            return initialize(flagDecoder, args, hookedInit, update, subscriptions, hookedStepperBuilder)
        }

        // hook process creation
        // TODO [kl] re-enable
        // var nativeBinding = _elm_lang$core$Native_Scheduler.nativeBinding
        // _elm_lang$core$Native_Scheduler.nativeBinding = function() {
        //     var def = nativeBinding.apply(this, arguments);
        //     var callback = def.callback
        //     def.callback = function() {
        //         var result = callback.apply(this, arguments)
        //         if (result) {
        //             cancellers.push(result);
        //             return function() {
        //                 cancellers.splice(cancellers.indexOf(result), 1);
        //                 return result();
        //             };
        //         }
        //         return result;
        //     };
        //     return def;
        // };

        scope['_elm_hot_loader_init'] = function (Elm) {
            console.log("_elm_hot_loader_init() with existing instances: " + JSON.stringify(instances))
            // swap instances
            var removedInstances = [];
            for (var id in instances) {
                console.log("attempting to reconnect instance id: " + id)
                var instance = instances[id]
                if (instance.domNode.parentNode) {
                    swap(Elm, instance);
                } else {
                    console.log("Removing dead Elm instance")
                    removedInstances.push(id);
                }
            }

            removedInstances.forEach(function (id) {
                delete instance[id];
            });

            // wrap all public modules
            var publicModules = findPublicModules(Elm);
            publicModules.forEach(function (m) {
                console.log("Wrapping public entry point module: " + m.path)
                wrapPublicModule(m.path, m.module);
            });
        }
    })(jsModule);
}
//////////////////// HMR END ////////////////////
_elm_hot_loader_init(scope['Elm'])
