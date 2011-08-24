/**
 * Copyright 2011 Ivan Kolodyazhny (e0ne)
 * All Rights Reserved.
 *
 *    Licensed under the Apache License, Version 2.0 (the "License"); you may
 *    not use this file except in compliance with the License. You may obtain
 *    a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *    WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *    License for the specific language governing permissions and limitations
 *    under the License.
 */

(function( $ ){
    var methods = {
        init : function( options ) {
            var settings = {
                'template' : 'ajax_table_template',
                'url' : '',
                'interval' : 5000,
                'beforeUpdate' : null,
                'afterUpdate': null
            };
            if ( options ) {
                $.extend( settings, options );
            }

            var $this = $(this);
            var data = $this.data('ajaxTable');

            if (!data){
                $(this).data('ajaxTable', {
                    timers : {},
                    beforeUpdate : settings.beforeUpdate,
                    afterUpdate : settings.afterUpdate
                });
                data = $this.data('ajaxTable');
                
            }
            
            var selector = this;
            function update(){
                if (data.beforeUpdate){
                    data.beforeUpdate();
                }

                selector.each(function(){
                    var elem = this;
                    $.get(settings.url, function(data){
                        var body = $(elem).children("tbody");
                        body.html("");
                        $("#" + settings.template).tmpl(data).appendTo(body);
                    });
                });

                if (data.afterUpdate){
                    data.afterUpdate();
                }
            }

            update();

            if (!data.timers[this.selector]){
                data.timers[this.selector] = window.setInterval(update, settings.interval);
            }
        },
        stop : function( ) {
            var $this = $(this);
            var data = $this.data('ajaxTable');
            if (data){
                window.clearInterval(data.timers[this.selector]);
                data.timers[this.selector] = null;
            }
        }
    };

    $.fn.ajaxTable = function(method) {
        if ( methods[method] ) {
            return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.tooltip' );
        }
    };
})( jQuery );