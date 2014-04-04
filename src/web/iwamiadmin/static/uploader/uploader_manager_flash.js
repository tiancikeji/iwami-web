/**
 * Created with JetBrains PhpStorm.
 * Author: limengjun
 * Date: 14-1-7
 * Time: 下午3:13
 */
(function(){
    function FileUp(options){
        var defaultOpt = {
            upload: {
                url: 'pkg/server/upload.php', //上传地址
                auto: true, //自动上传
                format: 'jpg|gif' //图片格式筛选，支持jpg gif bmp png
            },
            compress: {
                useCompress: true, //是否启用压缩，启用后会根据limit的配置对图片进行压缩
                compressGif: false, //所否压缩gif图片
                compressPng: false //所否压缩png图片
            },
            force: null,
            limit: {
                size: 3 * 1024 * 1024, //图片最大kb
                width: 3000, //图片最大宽度
                height: 3000 //图片最大高度
            },
            thumbs: {
                useThumbs: true, //是否上传缩略图
                width: 200, //缩略图宽度
                height: 200 //缩略图高度
            }
        };
        if(options.uploadButton){ //包装上传按钮，并计算上传按钮的大小
            var $uploadButton = $(options.uploadButton);
            defaultOpt.width = $uploadButton.width();
            defaultOpt.height = $uploadButton.height();
            defaultOpt.uploadButton = $uploadButton;
        }
        this._options = $.extend(true, defaultOpt, options || {});
        this._token = this._makeToken();
        this._flashVars = '';
        this._version = '1_0_1_3' + (+new Date());
        this._EVENTS = [
            'selected'
            ,'start'
            ,'progress'
            ,'complete'
            ,'error'
        ];
        this.createBasicEvent();
        this._reset();
    }
    $.extend(FileUp.prototype, {
        /**
         * 开始上传
         * @method start
         */
        start: function(){
            this.flash.start();
        }
        /**
         * 停止上传
         * @method stop
         */
        ,stop: function(){
            this.flash.pause();
        }
        /**
         * 删除文件
         * @method deleteFile
         * @param {String} id 需要删除文件的id
         */
        ,deleteFile: function(id){
            this.flash.deleteFile(id);
        }
        /**
         * 清空所有文件
         * @method clearList
         */
        ,clearList: function(){
            this.flash.clearList();
        }
        /**
         * 重传错误文件
         * @method reUploadError
         * @param {String} [id] 需要重传文件的id，若不传id，重传所有错误文件
         */
        ,reUploadError: function(id){
            this.flash.resetErrorStatus(id);
        },
        /**
         * 重载配置
         * @method reloadConfig
         * @param {Object} [options] 配置信息
         */
        reloadConfig: function(options){
            this._options = $.extend(true, this._options, options || {});
            this.flash.reloadConfig(options);
        },
        _reset: function(){
            this._initFlashvars();
            this._generateCallBack();
            this._initUI();
        }
        ,_initFlashvars: function(){
            var force = this._options.force || {};
            this._flashVars = [
                'useCompress=' + encodeURIComponent(this._options.compress.useCompress),
                'compressGif=' + encodeURIComponent(this._options.compress.compressGif),
                'compressPng=' + encodeURIComponent(this._options.compress.compressPng),
                'limitSize=' + encodeURIComponent(this._options.limit.size),
                'limitWidth=' + encodeURIComponent(this._options.limit.width),
                'limitHeight=' + encodeURIComponent(this._options.limit.height),
                'isAutoUp=' + encodeURIComponent(this._options.upload.auto),
                'uploadURL=' + encodeURIComponent(this._options.upload.url),
                'useWorker=false',
                'imgFormat=' + encodeURIComponent(this._options.upload.format),
                'forceWidth=' + encodeURIComponent(force.width || ''),
                'forceHeight=' + encodeURIComponent(force.height || ''),
                'get_upload_params=' + (this._options.get_upload_params ? encodeURIComponent(this._options.get_upload_params) : '')
            ].join('&');
        }
        ,_initUI: function(){
            var flashMsg = this._flashChecker();
            var version = flashMsg.version;
            var url;
            var id = 'flashUploader' + this._token;
            if(!flashMsg.hasFlash){
                this._flashError();
            }
            url = 'http://yy.iwami.cn/iwamiadmin/static/fileup.swf?v=' + this._version;

            var ie = '<object id="'+ id +'" name="'+ id +'" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="https://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0" width="'+ this._options.width +'" height="'+ this._options.height +'"><param name="allowScriptAccess" value="always" /><param value="transparent" name="wmode"><param name="flashvars" value="'+ this._flashVars +'" /><param name="allowFullScreen" value="false" /><param name="movie" value="'+ url +'" /></object>';

            var w3c = '<object id="'+ id +'" type="application/x-shockwave-flash" data="'+ url +'" width="'+ this._options.width +'" height="'+ this._options.height +'"><param name="allowScriptAccess" value="always" /><param value="transparent" name="wmode"><param name="flashvars" value="'+ this._flashVars +'" /></object>';

            if(!this._options.uploadButton){
                this._options.uploadButton = $('<div>').appendTo(document.body).css({
                    position: 'absolute'
                    ,width: '1px'
                    ,height: '1px'
                    ,overflow: 'hidden'
                    ,left: 1
                    ,bottom: 1
                });
            }

            if (navigator.appName.indexOf("Microsoft") != -1) {
                this._options.uploadButton.html(ie);
            } else {
                this._options.uploadButton.html(w3c);
            }
            this.flash =  document[id] || window[id];
        }
        ,_generateCallBack: function(){
            var self = this;
            for(var i = 0; i < this._EVENTS.length; i++){
                var evt = this._EVENTS[i]
                    ,callBack = evt + this._token;
                window[callBack] = (function(evt){
                    return function(data){
                        self.trigger(evt, data);
                    };
                })(evt);
                this._flashVars += '&' + this._decodeCamel(evt) + '=' + callBack;
            }
        }
        ,_decodeCamel: function(camel){
            return camel.replace(/([A-Z])/g, function(all, $1){return '_' + $1.toLowerCase();});
        }
        ,_flashChecker: function() {
            var hasFlash = false; //是否安装了flash
            var flashVersion; //flash版本
            var isIE =/*@cc_on!@*/0; //是否IE浏览器
            var swf;
            if (isIE) {
                swf = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
                if (swf) {
                    hasFlash = true;
                    flashVersion = swf.GetVariable("$version");
                }
            } else {
                if (navigator.plugins && navigator.plugins.length > 0) {
                    swf = navigator.plugins["Shockwave Flash"];
                    if (swf) {
                        hasFlash = true;
                        flashVersion = swf.description;
                    }
                }
            }
            return {
                hasFlash: hasFlash,
                version: flashVersion.match(/\d+/g)
            };
        }
        ,_flashError: function(){
            $('<center>检测到您的浏览器没有安装最新Adobe Flash Player插件，这会影响您访问本页面的部分功能。<br />请<a href="http://get.adobe.com/cn/flashplayer/" target="_blank">点此</a>安装</center>').appendTo($('body'));
        }
        ,_makeToken: function(){
            var S4 = function() {
                return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
            };
            return (S4()+S4()+'_'+S4()+S4()+S4());
        }
        ,uploadBase64: function(base64, callback){
            var flashCallBack = 'flashUploadBase64_' + this._makeToken();
            window[flashCallBack] = (function(callback){
                return function(result){
                    callback(result);
                };
            })(callback);
            this.flash.uploadBase64(base64, flashCallBack);
        }
    }, $.basicEvent);
    $.FileUp = FileUp;
})();