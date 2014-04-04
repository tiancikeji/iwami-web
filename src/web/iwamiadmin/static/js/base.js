/**
 * Created with JetBrains PhpStorm.
 * Author: limengjun
 * Date: 14-2-27
 * Time: 上午9:58
 */
/**
 * baiduTemplate简单好用的Javascript模板引擎 1.0.6 版本
 * http://baidufe.github.com/BaiduTemplate
 * 开源协议：BSD License
 * 浏览器环境占用命名空间 baidu.template ，nodejs环境直接安装 npm install baidutemplate
 * @param str{String} dom结点ID，或者模板string
 * @param data{Object} 需要渲染的json对象，可以为空。当data为{}时，仍然返回html。
 * @return 如果无data，直接返回编译后的函数；如果有data，返回html。
 * @author wangxiao
 * @email 1988wangxiao@gmail.com
 */

;(function(window){

    //取得浏览器环境的baidu命名空间，非浏览器环境符合commonjs规范exports出去
    //修正在nodejs环境下，采用baidu.template变量名
    var baidu = typeof module === 'undefined' ? (window.baidu = window.baidu || {}) : module.exports;

    //模板函数（放置于baidu.template命名空间下）
    baidu.template = function(str, data){

        //检查是否有该id的元素存在，如果有元素则获取元素的innerHTML/value，否则认为字符串为模板
        var fn = (function(){

            //判断如果没有document，则为非浏览器环境
            if(!window.document){
                return bt._compile(str);
            };

            //HTML5规定ID可以由任何不包含空格字符的字符串组成
            var element = document.getElementById(str);
            if (element) {

                //取到对应id的dom，缓存其编译后的HTML模板函数
                if (bt.cache[str]) {
                    return bt.cache[str];
                };

                //textarea或input则取value，其它情况取innerHTML
                var html = /^(textarea|input)$/i.test(element.nodeName) ? element.value : element.innerHTML;
                return bt._compile(html);

            }else{

                //是模板字符串，则生成一个函数
                //如果直接传入字符串作为模板，则可能变化过多，因此不考虑缓存
                return bt._compile(str);
            };

        })();

        //有数据则返回HTML字符串，没有数据则返回函数 支持data={}的情况
        var result = bt._isObject(data) ? fn( data ) : fn;
        fn = null;

        return result;
    };

    //取得命名空间 baidu.template
    var bt = baidu.template;

    //标记当前版本
    bt.versions = bt.versions || [];
    bt.versions.push('1.0.6');

    //缓存  将对应id模板生成的函数缓存下来。
    bt.cache = {};

    //自定义分隔符，可以含有正则中的字符，可以是HTML注释开头 <! !>
    bt.LEFT_DELIMITER = bt.LEFT_DELIMITER||'<%';
    bt.RIGHT_DELIMITER = bt.RIGHT_DELIMITER||'%>';

    //自定义默认是否转义，默认为默认自动转义
    bt.ESCAPE = true;

    //HTML转义
    bt._encodeHTML = function (source) {
        return String(source)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/\\/g,'&#92;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
    };

    //转义影响正则的字符
    bt._encodeReg = function (source) {
        return String(source).replace(/([.*+?^=!:${}()|[\]/\\])/g,'\\$1');
    };

    //转义UI UI变量使用在HTML页面标签onclick等事件函数参数中
    bt._encodeEventHTML = function (source) {
        return String(source)
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;')
            .replace(/\\\\/g,'\\')
            .replace(/\\\//g,'\/')
            .replace(/\\n/g,'\n')
            .replace(/\\r/g,'\r');
    };

    //将字符串拼接生成函数，即编译过程(compile)
    bt._compile = function(str){
        var funBody = "var _template_fun_array=[];\nvar fn=(function(__data__){\nvar _template_varName='';\nfor(name in __data__){\n_template_varName+=('var '+name+'=__data__[\"'+name+'\"];');\n};\neval(_template_varName);\n_template_fun_array.push('"+bt._analysisStr(str)+"');\n_template_varName=null;\n})(_template_object);\nfn = null;\nreturn _template_fun_array.join('');\n";
        return new Function("_template_object",funBody);
    };

    //判断是否是Object类型
    bt._isObject = function (source) {
        return 'function' === typeof source || !!(source && 'object' === typeof source);
    };

    //解析模板字符串
    bt._analysisStr = function(str){

        //取得分隔符
        var _left_ = bt.LEFT_DELIMITER;
        var _right_ = bt.RIGHT_DELIMITER;

        //对分隔符进行转义，支持正则中的元字符，可以是HTML注释 <!  !>
        var _left = bt._encodeReg(_left_);
        var _right = bt._encodeReg(_right_);

        str = String(str)

            //去掉分隔符中js注释
            .replace(new RegExp("("+_left+"[^"+_right+"]*)//.*\n","g"), "$1")

            //去掉注释内容  <%* 这里可以任意的注释 *%>
            //默认支持HTML注释，将HTML注释匹配掉的原因是用户有可能用 <! !>来做分割符
            .replace(new RegExp("<!--.*?-->", "g"),"")
            .replace(new RegExp(_left+"\\*.*?\\*"+_right, "g"),"")

            //把所有换行去掉  \r回车符 \t制表符 \n换行符
            .replace(new RegExp("[\\r\\t\\n]","g"), "")

            //用来处理非分隔符内部的内容中含有 斜杠 \ 单引号 ‘ ，处理办法为HTML转义
            .replace(new RegExp(_left+"(?:(?!"+_right+")[\\s\\S])*"+_right+"|((?:(?!"+_left+")[\\s\\S])+)","g"),function (item, $1) {
                var str = '';
                if($1){

                    //将 斜杠 单引 HTML转义
                    str = $1.replace(/\\/g,"&#92;").replace(/'/g,'&#39;');
                    while(/<[^<]*?&#39;[^<]*?>/g.test(str)){

                        //将标签内的单引号转义为\r  结合最后一步，替换为\'
                        str = str.replace(/(<[^<]*?)&#39;([^<]*?>)/g,'$1\r$2')
                    };
                }else{
                    str = item;
                }
                return str ;
            });


        str = str
            //定义变量，如果没有分号，需要容错  <%var val='test'%>
            .replace(new RegExp("("+_left+"[\\s]*?var[\\s]*?.*?[\\s]*?[^;])[\\s]*?"+_right,"g"),"$1;"+_right_)

            //对变量后面的分号做容错(包括转义模式 如<%:h=value%>)  <%=value;%> 排除掉函数的情况 <%fun1();%> 排除定义变量情况  <%var val='test';%>
            .replace(new RegExp("("+_left+":?[hvu]?[\\s]*?=[\\s]*?[^;|"+_right+"]*?);[\\s]*?"+_right,"g"),"$1"+_right_)

            //按照 <% 分割为一个个数组，再用 \t 和在一起，相当于将 <% 替换为 \t
            //将模板按照<%分为一段一段的，再在每段的结尾加入 \t,即用 \t 将每个模板片段前面分隔开
            .split(_left_).join("\t");

        //支持用户配置默认是否自动转义
        if(bt.ESCAPE){
            str = str

                //找到 \t=任意一个字符%> 替换为 ‘，任意字符,'
                //即替换简单变量  \t=data%> 替换为 ',data,'
                //默认HTML转义  也支持HTML转义写法<%:h=value%>
                .replace(new RegExp("\\t=(.*?)"+_right,"g"),"',typeof($1) === 'undefined'?'':baidu.template._encodeHTML($1),'");
        }else{
            str = str

                //默认不转义HTML转义
                .replace(new RegExp("\\t=(.*?)"+_right,"g"),"',typeof($1) === 'undefined'?'':$1,'");
        };

        str = str

            //支持HTML转义写法<%:h=value%>
            .replace(new RegExp("\\t:h=(.*?)"+_right,"g"),"',typeof($1) === 'undefined'?'':baidu.template._encodeHTML($1),'")

            //支持不转义写法 <%:=value%>和<%-value%>
            .replace(new RegExp("\\t(?::=|-)(.*?)"+_right,"g"),"',typeof($1)==='undefined'?'':$1,'")

            //支持url转义 <%:u=value%>
            .replace(new RegExp("\\t:u=(.*?)"+_right,"g"),"',typeof($1)==='undefined'?'':encodeURIComponent($1),'")

            //支持UI 变量使用在HTML页面标签onclick等事件函数参数中  <%:v=value%>
            .replace(new RegExp("\\t:v=(.*?)"+_right,"g"),"',typeof($1)==='undefined'?'':baidu.template._encodeEventHTML($1),'")

            //将字符串按照 \t 分成为数组，在用'); 将其合并，即替换掉结尾的 \t 为 ');
            //在if，for等语句前面加上 '); ，形成 ');if  ');for  的形式
            .split("\t").join("');")

            //将 %> 替换为_template_fun_array.push('
            //即去掉结尾符，生成函数中的push方法
            //如：if(list.length=5){%><h2>',list[4],'</h2>');}
            //会被替换为 if(list.length=5){_template_fun_array.push('<h2>',list[4],'</h2>');}
            .split(_right_).join("_template_fun_array.push('")

            //将 \r 替换为 \
            .split("\r").join("\\'");

        return str;
    };

})(window);


(function (factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as anonymous module.
        define(['jquery'], factory);
    } else {
        // Browser globals.
        factory(jQuery);
    }
}(function ($) {

    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            // This is a quoted cookie as according to RFC2068, unescape...
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        try {
            // Replace server-side written pluses with spaces.
            // If we can't decode the cookie, ignore it, it's unusable.
            s = decodeURIComponent(s.replace(pluses, ' '));
        } catch(e) {
            return;
        }

        try {
            // If we can't parse the cookie, ignore it, it's unusable.
            return config.json ? JSON.parse(s) : s;
        } catch(e) {}
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function (key, value, options) {

        // Write
        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setDate(t.getDate() + days);
            }

            return (document.cookie = [
                encode(key), '=', stringifyCookieValue(value),
                options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
                options.path    ? '; path=' + options.path : '',
                options.domain  ? '; domain=' + options.domain : '',
                options.secure  ? '; secure' : ''
            ].join(''));
        }

        // Read

        var result = key ? undefined : {};

        // To prevent the for loop in the first place assign an empty array
        // in case there are no cookies at all. Also prevents odd result when
        // calling $.cookie().
        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                // If second argument (value) is a function it's a converter...
                result = read(cookie, value);
                break;
            }

            // Prevent storing a cookie that we couldn't decode.
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }

        return result;
    };

    config.defaults = {};

    $.removeCookie = function (key, options) {
        if ($.cookie(key) !== undefined) {
            // Must not alter options, thus extending a fresh object...
            $.cookie(key, '', $.extend({}, options, { expires: -1 }));
            return true;
        }
        return false;
    };
}));



(function(){

    //tab切换组件
    function tabSwitch(options){
        var defaultOptions = {};
        options = $.extend(true, defaultOptions, options);
        this._options = options;
        this.init();
    }
    $.extend(tabSwitch.prototype, {
        init: function(){

        },
        bindEvents: function(){

        }
    });


    var Iwami = {
        rootUri: 'http://yy.iwami.cn',
        init: function(){
            this.bindEvents();
            this.form.buildCommonForm();
            this.login.init();
            this.initPermission();

        },
        login: {
            //获取登录用户的id
            getUserId: function(){
                return $.cookie('adminid');
            },
            init: function(){
                if($.cookie('username')){
                    $('#loginUser').html('<li>' +
                            '<a>'+ $.cookie('username') + '</a>' +
                        '</li>' +
                        '<li><a href="#" class="j_logout">退出</a></li>'+
                        '<li><a href="editpassword.html" class="">修改密码</a>'+
                        '</li>').find('.j_logout').click(function(e){
                        $.removeCookie('username');
                        $.removeCookie('userid');
                        $.removeCookie('roles');
                        location.href = 'login.html';
                    })
                }else if(!location.pathname.match('login.html')){
                    location.href = 'login.html';
                }
            }
        },
        ajax: {
            validRes: function(res){
                if(res.status === 300){
                    $.Iwami.showTip('参数错误', 1000, 'danger');
                    return false;
                }
                if(res.status === 500){
                    $.Iwami.showTip('请登录', 1000, 'danger');
                    return false;
                }
//                if(res.status != 0){
//                    $.Iwami.showTip('请求出错，错误信息：'+ res.msg +',错误状态：' + res.status , 3000, 'danger');
//                    return false;
//                }
                return true;
            }
        },
        switchCategory: function($dl, isFold){
            var $btn = $dl.children('dt').find('.toggle-btn');
            var $list = $dl.children('dd');
            if(arguments.length < 2){
                isFold = $list.css('display') == 'none' ? false : true;
            }
            if(isFold){
                $list.slideUp(function(){$btn.html('+');});
            }else{
                $list.slideDown(function(){$btn.html('—');});
            }
        },
        bindEvents: function(){
            var _self = this;
            $('.toggle-btn').click(function(e){
                e.preventDefault();
                var $target = $(this);
                _self.switchCategory($target.closest('dl'));
            });
        },
        showTip: function(msg, timeout, type){
            alert(msg);
        },
        selectNav: function(selector){
            $(selector).addClass('active');
        },
        initPermission: function(){
            var $nav = $('.j_nav');
            var permission = $.cookie('roles');
            if(!permission){ //未登录，没有任何导航菜单
                $nav.remove();
                $nav = null;
                return;
            }
            permission = parseInt(permission, 10).toString(2); //转换为二进制
            //有calss=j_permission的元素就需要权限控制，如果没有权限，则remove这个元素
            $('.j_permission').each(function(i, o){
                var $target = $(this);
                var permissionIndex = $target.attr('data-permission');
                if(permissionIndex){
                    //permissionIndex > 7 && permission.length < 8需要第8位权限但是第八位没有，代表无权限
                    if((permissionIndex > 7 && permission.length < 8) || permission.substr(-permissionIndex, 1) != 1){//无权限
                        $target.remove();
                    }
                }
            });
            $nav.css('visibility', 'visible');
        },
        form: {
            //是否编辑模式
            isEditMode: function(){
                return $.Iwami.getParameter('form_edit_mode') == '1'
            },
            initEditForm: function($commmonForm){
                $commmonForm.find('.j_common_form_autovalue').each(function(i, o){
                    var $input = $(this);
                    var value = $.Iwami.getParameter('form_' + $input.attr('name'));
                    //console.log($input, value)

                    if($input.filter('select').length > 0){ //select
                        var options = $input[0].options;
                        for(var optIndex = 0; optIndex < options.length; optIndex++){
                            var opt = options[optIndex];
                            if(opt.value == value){
                                opt.setAttribute('selected', 'selected');
                                break;
                            }
                        }
                    }else if($input.attr('type') == 'checkbox'){ //checkbox{
                        if($input.attr('data-checked-vaue') == value){
                            $input.attr('checked', 'checked');
                        }
                    }else{
                        $input.val(value);
                    }


                });
            },
            //操作form表单的编辑、新增
            buildCommonForm: function(){
                var _this = this;
                $('.j_common_form').each(function(i, o){
                    var $commmonForm = $(this);
                    if(!$commmonForm.length){
                        return;
                    }

                    var isEdit = $.Iwami.form.isEditMode(); //是否编辑模式
                    var postUrl;
                    if(isEdit){
                        _this.initEditForm($commmonForm);
                        document.title = document.title.replace(/新增|新建/, '编辑');
                        postUrl = $commmonForm.attr('data-edit-url') + '?adminid=' + $.Iwami.login.getUserId() + '&id=' + $.Iwami.getParameter('form_id');
                    }else{//新增
                        postUrl = $commmonForm.attr('data-add-url') + '?adminid=' + $.Iwami.login.getUserId();
                    }

                    //取消按钮
                    $commmonForm.find('button[type="cancel"]').click(function(e){
                        e.preventDefault();
                        if(confirm('你确认放弃已输入内容？')){
                            if($commmonForm.attr('data-back-url')){
                                location.href = $commmonForm.attr('data-back-url');
                            }
                        }
                    });

                    if($commmonForm.hasClass('j_common_form_autosubmit')){

                        $commmonForm.submit(function(e){
                            e.preventDefault();
                            if(!$.Iwami.validForm(this)){
                                return;
                            }
                            $.post($.Iwami.rootUri + postUrl, $commmonForm.serialize(), function(res){
                                if($.Iwami.ajax.validRes(res)){ //验证通过
                                    if(res.status != 0){
                                        if($commmonForm.attr('data-error')){
                                            $.Iwami.showTip($commmonForm.attr('data-error'), 2000, 'warning');
                                        }else{
                                            $.Iwami.showTip('操作失败，请稍后再试', 2000, 'warning');
                                        }
                                    }else{
                                        $.Iwami.showTip('操作成功！', 2000, 'success');
                                        setTimeout(function(){
                                            if($commmonForm.attr('data-back-url')){
                                                location.href = $commmonForm.attr('data-back-url');
                                            }
                                        }, 1500);
                                    }
                                }
                            }, 'json');
                        });
                    }

                });

            }
        },
        //分页组件
        listManager: {
            init: function($list, step, render){
                this.$list = $list;
                this._bindEvents();
                this.start = 0;
                this.step = step;
                this.render = render;
                render.apply(this);
            },
            _bindEvents: function(){
                var _this = this;
                if(this.$list.data('eventsBinded')){
                    return;
                }
                this.$list.data('eventsBinded', true);
                this.$list.delegate('.j_btn_page', 'click', function(e){
                    e.preventDefault();
                    var $target = $(this);
                    var page = +$target.attr('data-page');
                    _this.start = (page - 1) * _this.step;
                    _this.render && _this.render.apply(_this);
                });
            }
        }
    };

    //组件：生成联动菜单的组件
    /**
     * selectTree:{
     *     name: 'select1',
     *     id: 'select1',
     *     label: '<label>国家</label>', //select的label
     *     childrenTag: 'children', //js里获取children的下标
     *     textTag: 'name', //js里获取option的text的下标
     *     valueTag: 'id', //js里获取option的value的下标
     *     children: '二级select.....'
     * }
     * example
     * new $.Iwami.linkAgeSelect($('body'),[{name:'中国',id:'1',children:[{cityName:'重庆',cityId:'6'},{cityName:'北京',cityId:'9'}]},{name:'美国',id:'2'}],{id:'select1',name:'select1',label:'<label>国家</label>',textTag:'name',valueTag:'id',childrenTag:'children',children:{id:'select2',name:'select2',label:'<label>城市</label>',textTag:'cityName',valueTag:'cityId',childrenTag:'children'}})
     *
     * */
    function linkAgeSelect($container, data, selectTree, options){
        if(!data || !selectTree){
            return;
        }
        this.$container = $container;
        this.data = data;
        this.selectTree = selectTree;
        var defaultOptions = {};
        options = $.extend(true, defaultOptions, options);
        this._options = options;
        this.init();
    }
    $.extend(linkAgeSelect.prototype, {
        init: function(){
            this.createSelect(this.selectTree, this.data, 1);
            this.bindEvents();
        },
        createSelect: function(selectData, data, level){ //通过当前是第几级来获得数据
            console.log('createSelect', level)
            var tempSelect = document.createElement('select');
            tempSelect.setAttribute('name', selectData.name);
            tempSelect.setAttribute('id', selectData.id);
            tempSelect.setAttribute('data-level', level);
            if(selectData.label){
                this.$container.append($(selectData.label));
            }
            this.$container.append(tempSelect);
            this.renderOptions(tempSelect, selectData, data);
            if(selectData.children){
                console.log(data,selectData.childrenTag)
                var index = tempSelect.options[tempSelect.selectedIndex].getAttribute('data-index');
                this.createSelect(selectData.children, data[index][selectData.childrenTag], level+1);
            }
        },
        getData: function(level){

        },
        bindEvents: function(){
            var _self = this
            this.$container.find('select').bind('change', function(e){
                var $target = $(this);
                var changeLevel = $target.attr('data-level'); //被改变的级数
                if(!changeLevel){
                    return;
                }
                console.log('changegegegegege')
                _self.renderChange(changeLevel, _self.selectTree, _self.data);

                return;
                var childrenNode= _self.selectTree;
                var childrenData = _self.data[childrenNode.index];
                for(var i = 2; i <= level; i++){
                    childrenNode = childrenNode.children;
                }
                _self.changeLevel()
            });
        },
        renderOptions: function(select, selectData, data){
            select.options.length = 0;
            console.log(data)
            for(var i in data){
                if(data.hasOwnProperty(i)){
                    var item = data[i]
                    var option = new Option(item[selectData.textTag], item[selectData.valueTag]);
                    option.setAttribute('data-index', i);
                    if(selectData.selected == item[selectData.valueTag]){
                        option.setAttribute('selected', 'selected');
                    }
                    select.options.add(option);
                }
            }
        },
        renderChange: function(changeLevel, curSelectData, curData){
            var $curSelect = $('#' + curSelectData.id);
            var curLevel = $curSelect.attr('data-level');
            if(!curLevel){
                return;
            }
            var curSelect = $curSelect[0]; //原生select
            console.log(changeLevel, curLevel,curData)
            if(curLevel > changeLevel){ //需要渲染当前这一级
                this.renderOptions(curSelect, curSelectData, curData);
            }
            if(curSelectData.children){ //渲染下一级
                //获取当前选中option在js对象里的索引
                var index = curSelect.options[curSelect.selectedIndex].getAttribute('data-index');
                this.renderChange(changeLevel, curSelectData.children, curData[index][curSelectData.childrenTag]);
            }

        }
    });
    Iwami.linkAgeSelect = linkAgeSelect;

    //获取URL
    Iwami.getParameter = function(name){
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return decodeURIComponent(r[2]); return null;
    }


    //简单的form验证
    var validForm = function(form){
        //form = $(form);
        for(var i = 0; i < form.elements.length; i++){
            var input = form.elements[i];
            if(input.getAttribute('data-valid') == 1 && !input.value){
                var $errorTarget = $(input);
                if(input.getAttribute('data-valid-errorTarget')){
                    $errorTarget = $(input.getAttribute('data-valid-errorTarget'));
                    if(!$errorTarget.length){
                        $errorTarget = $(input);
                    }
                }
                console.log('$errorTarget',$errorTarget)
               // alert(input.getAttribute('data-valid-message'));
                input.focus();
                Iwami.PopTip.showError(input.getAttribute('data-valid-message'), $errorTarget, 3000);

                input.className = input.className + ' valid-error';
                return false;
            }
        }
        return true;
    };
    Iwami.validForm = validForm;

    //showTips
    function showTip(tips, timeOut, type){
        var $tips = $('<div style="z-index: 10000;" class="alert alert-'+ (type || 'success') + '">' + tips + '</div>');
        var $window = $(window);
        var targetTop = $window.scrollTop() + $window.height() / 2;
        var targetLeft = $window.width() / 2;

        $tips.css({
            position: 'absolute',
            top: targetTop + 100,
            left: targetLeft
        }).appendTo(document.body).animate({
            top: targetTop
        }, 500 );
        setTimeout(function(){
            $tips.remove();
        }, timeOut);
    }

    //ErrorTip
    var PopTip = {
        _createTip: function(content, className){
            return $('<div class="ui-tips ui-tips-top ' + className + '" style="visibility: hidden;">' +
                '<div class="ui-tips-arrow">' +
                '    <i></i>' +
                '</div>' +
                '<div class="ui-tips-bd" style="color:#fb7f75;">' +
                '    <p>' + content + '</p>' +
                '</div>' +
                '</div>').appendTo($('body'));
        },
        showError: function(error, $target, timeout){
            var $tip = PopTip._createTip(error, '');
            var tipWidth = $tip.outerWidth();
            $tip.find('.ui-tips-arrow').css({
                'left': tipWidth / 2 - 8 + 'px'
            });

            var targetWidth = $target.outerWidth();
            var targetHeight = $target.outerHeight();
            var targetOffset = $target.offset();
            $tip.css({
                visibility: 'visible',
                top: targetOffset.top + targetHeight + 10,
                left: targetOffset.left + targetWidth / 2 - tipWidth / 2
            });

            if(timeout){
                setTimeout(function(){
                    $tip.remove();
                }, timeout);
            }

            $target.bind('blur', function(e){
                $target.removeClass('ui-input-error');
                $tip.remove();
            }).addClass('ui-input-error')[0].focus();
        }
    };
    Iwami.PopTip = PopTip;

    Iwami.showTip = showTip;

    $.Iwami = Iwami;
    $.Iwami.init();
})();