/**
 *  Copyright (c) 2011 Grid Dynamics Consulting Services, Inc, All Rights Reserved
 *  http://www.griddynamics.com
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
 *
 *    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 *  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function( $ ){
    var methods = {
        init : function( options ) {
            var settings = {
                'template' : 'ajax_table_template',
                'emptyTemplate' : null,
                'url' : '',
                'autoUpdate' : true,
                'interval' : 5000,
                'beforeUpdate' : null,
                'afterUpdate' : null,
                'sortable': false,
                'cacheable': false, // NOTE: this param isn't used in current version
                'beforeSort': null,
                'afterSort': null,
                'processResponse': null
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
                    afterUpdate : settings.afterUpdate,
                    beforeSort : settings.beforeSort,
                    afterSort : settings.afterSort,
                    processResponse : settings.processResponse,
                    cachedData: null
                });
                data = $this.data('ajaxTable');

            }
           
            var selector = this;

            var sort2dArray = function(array){
                // note: select sort method
                for(var i=0; i < array.length; i++) {
                    var k=i; var x=array[i];

                    for( var j=i+1; j < array.length; j++)
                      if (array[j][0] < x[0] ) {
                        k=j; x=array[j];
                      }

                    array[k] = array[i];
                    array[i] = x;
                  }
                return array;
            }
            var sort = function(sortOrder, column){
                if (data.beforeSort){
                    data.beforeSort();
                }

                var sorted_data = [];
                if (data.cachedData){
                    var sorted_column = new Array();
                    for (var i=0;i<data.cachedData.length; i++)
                    {
                        var currentItem = data.cachedData[i];
                        var dataItem = null;
                        for (var pi in currentItem)
                        {
                            if (pi == column){
                                dataItem = currentItem[pi];
                            }
                        }
                        sorted_column.push([dataItem, currentItem]);
                    }
                    sorted_column = sort2dArray(sorted_column);

                    if (sortOrder == 'desc') {
                        sorted_column = sorted_column.reverse();
                    }

                    for (i=0; i< sorted_column.length; i++){
                        sorted_data.push(sorted_column[i][1]);
                    }
                }
                selector.each(function(){
                    var elem = this;
                    var body = $(elem).children("tbody");
                    body.html("");
                    $("#" + settings.template).tmpl(sorted_data).appendTo(body);
                });
                if (data.afterSort){
                    data.afterSort();
                }
            }

            var initSort = function(isUpdated, tableData){
                var cache = new Array();
                selector.each(function(){
                    $(this).children("thead").children("tr").children("th[key]").click(function(){
                        var th = $(this);
                        var sortOrder = th.attr("sortOrder");

                        if (sortOrder){
                            if (sortOrder == 'asc'){
                                sortOrder = 'desc';
                            } else {
                                sortOrder = 'asc';
                            }
                        } else {
                            sortOrder = 'asc';
                        }
                        var tableHeaders = selector.children("thead").children("tr").children("th");
                        tableHeaders.removeAttr("sortOrder");
                        tableHeaders.removeClass("sorted-asc");
                        tableHeaders.removeClass("sorted-desc");
                        th.attr("sortOrder", sortOrder);
                        th.addClass("sorted-"+sortOrder);
                        sort(sortOrder, th.attr("key"));
                    });
                });
                data.cachedData = tableData;
            }

            function update(){
                selector.children("thead").children("tr").children("th").unbind("click");
                
                if (data.beforeUpdate){
                    data.beforeUpdate();
                }

                selector.each(function(){
                    var elem = this;
                    $.get(settings.url, function(response){
                        var body = $(elem).children("tbody");
                        body.html("");
                        if (data.processResponse) {
                        	if (data.processResponse(response, this, settings) != 0) {
                            	return;
                            }
                        }
                        if (response.table.length == 0 && settings.emptyTemplate != null) {
                            $("#" + settings.emptyTemplate).tmpl(response.table).appendTo(body);
                        } else
                        {
                            $("#" + settings.template).tmpl(response.table).appendTo(body);
                        }

                        if (data.afterUpdate){
                            data.afterUpdate();
                        }
                        if (settings.sortable){
                            var isUpdated = true;
                            if (settings.cacheable){
                                isUpdated = false;
                            }
                            initSort(isUpdated, response.table);
                            selector.children("thead").children("tr").children("th.sorted-asc").each(function(){

                                sort($(this).attr("sortOrder"), $(this).attr("key"));
                            });
                            selector.children("thead").children("tr").children("th.sorted-desc").each(function(){
                                sort($(this).attr("sortOrder"), $(this).attr("key"));
                            });
                        }
                    });
                });
            }

            update();

            if (settings.autoUpdate && !data.timers[this.selector]){
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
            $.error( 'Method ' +  method + ' does not exist on jQuery.ajaxTable' );
        }
    };
})( jQuery );