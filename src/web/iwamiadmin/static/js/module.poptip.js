(function(){
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
            var tipHeight = $tip.outerHeight();
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
    $.Iwami.PopTip = PopTip;
    /*function(options){
        var defaultOptions = {

        };
        this._options = $.extend(defaultOptions, options);
        this._init();
    };
    $.extend(PopTip.prototype, {
        _init: function(){
            this._createTip();
            this._bindEvents();
        },
        _createTip: function(){
            this._$PopTip = $('<div class="ui-tips ui-tips-top" style="visibility: hidden; 50px; left: 80px;">' +
                '<div class="ui-tips-arrow" style="left: 17px;">' +
                '    <i></i>' +
                '</div>' +
                '<div class="ui-tips-bd" style="color:#fb7f75;">' +
                '    <p style="font-size: 16px;font-weight: bold;margin-bottom: 5px;">' + this._options.content + '</p>' +
                '</div>' +
            '</div>').appendTo($('body'));
        }
    });
    */
})();