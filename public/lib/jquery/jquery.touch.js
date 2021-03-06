/*
 * Drag, scale and rotate elements during touch, using with Hammer.js
 */

(function($, TweenLite) {
    "use strict";

    var defaults = {
        draggable: true,
        rotatable: true,
        scalable: true,
        tween: {
            use: false,
            speed: 1,
            ease: ''
        },
        touchClass: 'touching'
    };

    var props = $.event.props || [];
    props.push("touches");
    props.push("scale");
    props.push("rotation");
    $.event.props = props;

    $.fn.getMatrix = function(i) {
        if(this.css('transform') === 'none') return 0;
        var array = this.css('transform').split('(')[1].split(')')[0].split(',');
        return array[i] || array;
    };

    function Touch(elem, options) {

        this.elem = elem;
        this.$elem = $(elem);

        this.mc = new Hammer(elem);

        this.mc.get('pinch').set({ enable: true });
        this.mc.get('rotate').set({ enable: true });

        this.options = $.extend({}, defaults, options);

        //detect support for Webkit CSS 3d transforms
        this.supportsWebkit3dTransform = ('WebKitCSSMatrix' in window && 'm11' in new WebKitCSSMatrix());

        this.init();
    }

    //static property to store the zIndex for an element
    Touch.zIndexCount = 1;

    Touch.prototype.init = function() {
        this.rotation = 0; //default rotation in degrees
        this.scale = 1.0; //default scale value
        this.gesture = false; //flags a 2 touch gesture
        this.mc.on('panstart pinchstart rotatestart', this.touchstart.bind(this));
    };

    Touch.prototype.touchstart = function(e) {
        e.preventDefault();

        //bring item to the front
        this.elem.style.zIndex = Touch.zIndexCount++;
        this.mc.on('panmove pinchmove rotatemove', this.touchmove.bind(this));
        this.mc.on('panend pancancel pinchend pinchcancel rotateend rotatecancel', this.touchend.bind(this));

        if(this.options.touchClass) {
            this.$elem.addClass(this.options.touchClass);
        }

        this.start0X = this.$elem.getMatrix(4) - e.pointers[0].pageX;
        this.start0Y = this.$elem.getMatrix(5) - e.pointers[0].pageY;
        if(e.pointers.length < 2) return;
        this.start1X = this.$elem.getMatrix(4) - e.pointers[1].pageX;
        this.start1Y = this.$elem.getMatrix(5) - e.pointers[1].pageY;

    };

    Touch.prototype.touchmove = function(e) {

        e.preventDefault();

        var myTransform = "",
            x1 = 0,
            y1 = 0,
            x2 = 0,
            y2 = 0,
            curX = 0,
            curY = 0;

        //drag event
        if(e.pointers.length === 1) {

            //get drag point
            curX = this.start0X + e.pointers[0].pageX;
            curY = this.start0Y + e.pointers[0].pageY;

            //translate drag
            if(this.options.draggable) {
                if(this.supportsWebkit3dTransform) {
                    myTransform += 'translate3d(' + curX + 'px,' + curY + 'px, 0)';
                } else {
                    myTransform += 'translate(' + curX + 'px,' + curY + 'px)';
                }
            }

            //persist scale and rotate values from previous gesture
            if(this.options.scalable) {
                myTransform += "scale(" + (this.scale) + ")";
            }

            if(this.options.rotatable) {
                myTransform += "rotate(" + ((this.rotation) % 360) + "deg)";
            }
        } else if(e.pointers.length === 2) {

            //gesture event
            this.gesture = true;

            //get middle point between two touches for drag
            x1 = this.start0X + e.pointers[0].pageX;
            y1 = this.start0Y + e.pointers[0].pageY;
            x2 = this.start1X + e.pointers[1].pageX;
            y2 = this.start1Y + e.pointers[1].pageY;
            curX = (x1 + x2) / 2, curY = (y1 + y2) / 2;

            //translate drag
            if(this.options.draggable) {
                if(this.supportsWebkit3dTransform) {
                    myTransform += 'translate3d(' + curX + 'px,' + curY + 'px, 0)';
                } else {
                    myTransform += 'translate(' + curX + 'px,' + curY + 'px)';
                }
            }

            //scale and rotate
            if(this.options.scalable) {
                if(this.scale* e.scale > 2){
                    myTransform += "scale(2)";
                }else if(this.scale* e.scale<0.5){
                    myTransform += "scale(0.5)";
                }else{
                    myTransform += "scale(" + (this.scale * e.scale) + ")";
                }
            }

            if(this.options.rotatable) {
                myTransform += "rotate(" + ((this.rotation + e.rotation) % 360) + "deg)";
            }
        }

        if(this.options.tween.use) {
            TweenLite.to(this.elem, this.options.tween.speed, {
                css: { transform: myTransform },
                ease: this.options.tween.ease
            });
        } else {
            this.elem.style.webkitTransform = this.elem.style.MozTransform = this.elem.style.msTransform = this.elem.style.OTransform = this.elem.style.transform = myTransform;
        }
    };

    Touch.prototype.touchend = function(e) {

        e.preventDefault();

        this.$elem.off('.touch');

        //store scale and rotate values on gesture end
        if(this.gesture) {
            if(this.scale* e.scale > 2){
                    this.scale = 2;
                }else if(this.scale* e.scale<0.5){
                    this.scale = 0.5;
                }else{
                    this.scale *= e.scale;
                }
            this.rotation = (this.rotation + e.rotation) % 360;
            this.gesture = false;
        }

        if(this.options.touchClass) {
            this.$elem.removeClass(this.options.touchClass);
        }
    };

    // plugin wrapper
    $.fn.touch = function(options) {
        return this.each(function() {
            if (!$.data(this, "plugin_touch")) {
                $.data(this, 'plugin_touch', new Touch(this, options));
            }
            if($.data(this, "plugin_touch").rotation){
                $.data(this, "plugin_touch").rotation = 0;
            }
            if($.data(this, "plugin_touch").scale){
                $.data(this, "plugin_touch").scale = 1;
            }
        });
    };
}(jQuery, window.TweenLite));