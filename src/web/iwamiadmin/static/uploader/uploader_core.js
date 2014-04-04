/**
 * Created with JetBrains PhpStorm.
 * Author: limengjun
 * Date: 14-1-7
 * Time: 下午3:12
 */
(function(){
    var basicEvent = {
        createBasicEvent: function(){
            this._bellLabsEvent = {}; //创建事件对象的空间
        },
        bind: function(evt, func, scope){
            this._bellLabsEvent[evt] = {
                func: func,
                scope: scope || this
            };
            return this;
        },
        trigger: function(evt){
            if(this._bellLabsEvent[evt]){
                var evtTarget = this._bellLabsEvent[evt];
                var args = $.makeArray(arguments);
                args[0] = {target: this, type: evt};
                evtTarget.func.apply(evtTarget.scope, args);
            }
            return this;
        },
        unbind: function(evt){
            this._bellLabsEvent[evt] = null;
            return this;
        }
    };
    $.basicEvent = basicEvent;
})();