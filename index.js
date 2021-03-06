// Generated by CoffeeScript 1.7.0
(function() {
  var CommandsPlugin, ItemPile, shellwords,
    __slice = [].slice;

  shellwords = require('shellwords');

  ItemPile = require('itempile');

  module.exports = function(game, opts) {
    return new CommandsPlugin(game, opts);
  };

  module.exports.pluginInfo = {
    loadAfter: ['voxel-console']
  };

  CommandsPlugin = (function() {
    function CommandsPlugin(game, opts) {
      var _ref, _ref1;
      this.game = game;
      this.console = (_ref = this.game.plugins) != null ? _ref.get('voxel-console') : void 0;
      if (this.console == null) {
        throw 'voxel-commands requires voxel-console';
      }
      this.registry = (_ref1 = this.game.plugins) != null ? _ref1.get('voxel-registry') : void 0;
      if (this.registry == null) {
        throw 'voxel-commands requires voxel-registry';
      }
      this.handlers = {
        undefined: function() {
          var args, command;
          command = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
          return this.console.log("Invalid command " + command + " " + (args.join(' ')));
        },
        help: function() {
          this.console.log("Available commands:");
          this.console.log(".pos x y z");
          this.console.log(".home");
          this.console.log(".item name [count [tags]]");
          this.console.log(".block name [data]");
          this.console.log(".plugins");
          this.console.log(".enable plugin");
          return this.console.log(".disable plugin");
        },
        plugins: function() {
          var list, _ref2;
          list = (_ref2 = this.game.plugins) != null ? _ref2.list() : void 0;
          return this.console.log(("Enabled plugins (" + list.length + "): ") + list.join(' '));
        },
        enable: function(name) {
          var _ref2;
          if ((_ref2 = this.game.plugins) != null ? _ref2.enable(name) : void 0) {
            return this.console.log("Enabled plugin: " + name);
          } else {
            return this.console.log("Failed to enable plugin: " + name);
          }
        },
        disable: function(name) {
          if (this.game.plugins.disable(name)) {
            return this.console.log("Disabled plugin: " + name);
          } else {
            return this.console.log("Failed to disable plugin: " + name);
          }
        },
        pos: function(x, y, z) {
          var player, _ref2;
          player = (_ref2 = this.game.plugins) != null ? _ref2.get('voxel-player') : void 0;
          if (player) {
            player.moveTo(x, y, z);
            return this.console.log([player.position.x, player.position.y, player.position.z]);
          }
        },
        home: function() {
          var _ref2, _ref3;
          return (_ref2 = this.game.plugins) != null ? (_ref3 = _ref2.get('voxel-player')) != null ? _ref3.home() : void 0 : void 0;
        },
        item: function(name, count, tags) {
          var carry, pile, props, _ref2;
          props = this.registry.getItemProps(name);
          if (props == null) {
            this.console.log("No such item: " + name);
            return;
          }
          if (count == null) {
            count = 1;
          }
          if (tags == null) {
            tags = void 0;
          }
          pile = new ItemPile(name, count, tags);
          carry = (_ref2 = this.game.plugins) != null ? _ref2.get('voxel-carry') : void 0;
          if (carry) {
            carry.inventory.give(pile);
            if (tags == null) {
              tags = '';
            }
            return this.console.log("Gave " + name + " x " + count + " " + tags);
          }
        },
        block: function(name, data) {
          var blockdata, dataInfo, hit, index, oldData, oldIndex, oldName, reachDistance, x, y, z, _ref2, _ref3;
          if (name != null) {
            index = this.registry.getBlockIndex(name);
            if (index == null) {
              this.console.log("No such block: " + name);
              return;
            }
          }
          reachDistance = 8;
          hit = this.game.raycastVoxels(this.game.cameraPosition(), this.game.cameraVector(), reachDistance);
          if (!hit) {
            this.console.log("No block targetted");
            return;
          }
          _ref2 = hit.voxel, x = _ref2[0], y = _ref2[1], z = _ref2[2];
          oldIndex = hit.value;
          oldName = this.registry.getBlockName(oldIndex);
          if (name != null) {
            this.game.setBlock(hit.voxel, index);
          }
          blockdata = (_ref3 = this.game.plugins) != null ? _ref3.get('voxel-blockdata') : void 0;
          if (blockdata != null) {
            oldData = blockdata.get(x, y, z);
            if (data != null) {
              blockdata.set(x, y, z, data);
            }
          }
          dataInfo = "";
          if (oldData != null) {
            dataInfo = "" + (JSON.stringify(oldData)) + " -> ";
          }
          if (data == null) {
            data = oldData;
          }
          if (oldData != null) {
            dataInfo += JSON.stringify(data);
          }
          if (name == null) {
            name = oldName;
          }
          if (index == null) {
            index = oldIndex;
          }
          return this.console.log("Set (" + x + ", " + y + ", " + z + ") " + oldName + "/" + oldIndex + " -> " + name + "/" + index + "  " + dataInfo);
        }
      };
      this.handlers.p = this.handlers.position = this.handlers.tp = this.handlers.pos;
      this.handlers.i = this.handlers.give = this.handlers.item;
      this.handlers.b = this.handlers.setblock = this.handlers.set = this.handlers.block;
      this.enable();
    }

    CommandsPlugin.prototype.process = function(input) {
      var args, command, connection, handler, words, _ref, _ref1;
      if (input.indexOf('.') !== 0) {
        this.console.log(input);
        connection = (_ref = this.game.plugins) != null ? (_ref1 = _ref.get('voxel-client')) != null ? _ref1.connection : void 0 : void 0;
        if (connection != null) {
          connection.emit('chat', {
            message: input
          });
        } else {
          this.console.log('Not connected to server. Type .help for commands');
        }
        return;
      }
      input = input.substring(1);
      words = shellwords.split(input);
      command = words[0], args = 2 <= words.length ? __slice.call(words, 1) : [];
      handler = this.handlers[command];
      if (handler == null) {
        handler = this.handlers.undefined;
        args.unshift(command);
      }
      return handler.apply(this, args);
    };

    CommandsPlugin.prototype.enable = function() {
      var _ref, _ref1, _ref2;
      if ((_ref = this.console.widget) != null) {
        _ref.on('input', this.onInput = (function(_this) {
          return function(input) {
            return _this.process(input);
          };
        })(this));
      }
      return (_ref1 = this.game.plugins) != null ? (_ref2 = _ref1.get('voxel-client')) != null ? _ref2.connection.on('chat', this.onChat = (function(_this) {
        return function(input) {
          var _ref3;
          return _this.console.log((_ref3 = input.message) != null ? _ref3 : input);
        };
      })(this)) : void 0 : void 0;
    };

    CommandsPlugin.prototype.disable = function() {
      var _ref, _ref1;
      this.console.widget.removeListener('input', this.onInput);
      return (_ref = this.game.plugins) != null ? (_ref1 = _ref.get('voxel-client')) != null ? _ref1.connection.removeListener('chat', this.onChat) : void 0 : void 0;
    };

    return CommandsPlugin;

  })();

}).call(this);
