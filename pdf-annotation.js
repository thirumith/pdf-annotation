'use strict';

(function (angular, factory) {
    if (typeof define === 'function' && define.amd) {
        define('pdf-annotation', ['angular'], function (angular) {
            return factory(angular);
        });
    } else {
        return factory(angular);
    }
})(typeof angular === 'undefined' ? null : angular, function (angular) {

    var module = angular.module('pdfAnnotation', []);

    'use strict';

    module.factory('pdfAnnotationFactory', function () {
        var factoryObj = {};
        var lineP1, lineP2, lineP3, lineP4, i, m, xPos, yPos;
        factoryObj.options = {
            viewport: '',
            canvas_rand: '',
            ctx_rand: '',
            renderContext: { canvasContext: '', viewport: '' },
            bindFlag: '',
            btnFlag: false,
            bindCnt: 0,
            pdfOptions: {},
            toolsObj: {},
            optionArrData: {
                startX: [],
                startY: [],
                endX: [],
                endY: [],
                pencilData: []
            },
            pdfWorker: 'src/js/pdf.worker.js',
            actionListObj: []
        };

        factoryObj.history = {
            options: {
                canvas_width: '',
                canvas_height: '',
                activePage: 0,
                totalPage: 1,
                enablePrevBtn: false,
                enableNextBtn: false,
                font_size: 18,
                fillStyle: 'FF0000',
                lineWidth: 2,
                undoFlag: false,
                redoFlag: false,
                arrData: {
                    startX: [],
                    startY: [],
                    endX: [],
                    endY: [],
                    pencilData: []
                }
            },
            initial_canvas_url: [],
            final_canvas_url: [],
            redo_list: [],
            undo_list: [],
            raw_undo_list: [],
            raw_redo_list: [],
            raw_undo_ver_list: [],
            raw_redo_ver_list: [],
            deletedAttachmentArr: [],
            tmp_raw_undo_list: '',
            setStyleElement: function(canvas, ctx) {
                ctx.fillStyle = '#' + this.options.fillStyle.replace('#', '');
                ctx.font = this.options.font_size + 'px Calibri';
                ctx.lineWidth = this.options.lineWidth;
                ctx.strokeStyle = '#' + this.options.fillStyle.replace('#', '');
            },
            resetStyleElement: function() {
                this.options.fillStyle = document.getElementById('fillstyle').value;
                this.options.font_size = document.getElementById('fontsize').value;
                this.options.lineWidth = document.getElementById('linewidth').value;
            },
            setButtonStyle: function() {
                if (this.raw_undo_ver_list.length > 0) {
                    if (this.raw_undo_ver_list[this.options.activePage].length > 0 || this.raw_undo_list[this.options.activePage].length > 0) {
                        factoryObj.options.toolsObj.undo.classList.remove('cur_disable');
                    } else {
                        factoryObj.options.toolsObj.undo.className += ' cur_disable';
                    }
                    if(this.raw_redo_ver_list.length === 0) {
                        this.raw_redo_ver_list[this.options.activePage] = [];
                    }

                    if (this.raw_redo_ver_list[this.options.activePage].length > 0) {
                        factoryObj.options.toolsObj.redo.classList.remove('cur_disable');
                    } else {
                        factoryObj.options.toolsObj.redo.className += ' cur_disable';
                    }
                } else {
                    factoryObj.options.toolsObj.undo.className += ' cur_disable';
                    factoryObj.options.toolsObj.redo.className += ' cur_disable';
                }

                if(this.raw_undo_list.length > 0) {
                    var actionListObjLength = (factoryObj.options.actionListObj.length > 0) ? factoryObj.options.actionListObj[this.options.activePage].length : 0;
                    if(this.raw_undo_list[this.options.activePage].length === actionListObjLength) {
                        factoryObj.options.toolsObj.undo.className += ' cur_disable';
                    }
                }
            },
            saveState: function(canvas, list, keep_redo) {
                keep_redo = keep_redo || false;
                if (!keep_redo) {
                    this.redo_list = [];
                }

                if (!this.undo_list.hasOwnProperty(this.options.activePage)) {
                    this.undo_list[this.options.activePage] = [];
                }

                if (!this.raw_undo_list.hasOwnProperty(this.options.activePage)) {
                    this.raw_undo_list[this.options.activePage] = [];
                    this.raw_redo_list[this.options.activePage] = [];

                    this.raw_undo_ver_list[this.options.activePage] = [];
                    this.raw_redo_ver_list[this.options.activePage] = [];
                }

                var canvasData = canvas.toDataURL();
                if (list) {
                    if (!list.hasOwnProperty(this.options.activePage)) {
                        list[this.options.activePage] = [];
                    }
                    list[this.options.activePage][0] = canvasData;
                } else {
                    this.undo_list[this.options.activePage][0] = canvasData;
                    if (factoryObj.event.options.activeTool && factoryObj.event.options.activeTool.name == 'move' ) {
                        if(factoryObj.text.options.isEditText == true) {
                            this.saveRawData();    
                        } else {
                            if (this.tmp_raw_undo_list != '') {
                                var tmpData = angular.copy(this.tmp_raw_undo_list);
                                this.tmp_raw_undo_list = '';
                                if(this.raw_undo_ver_list.length === 0){
                                    this.raw_undo_ver_list[this.options.activePage] = [];
                                }
                                this.raw_undo_ver_list[this.options.activePage].push(tmpData);
                            }
                        }
                    } else {
                        this.saveRawData();
                    }
                }
                this.setButtonStyle();
                factoryObj.history.final_canvas_url[factoryObj.history.options.PrevPage] = canvasData;
            },
            saveRawData: function() {
                if (!factoryObj.event.options.activeTool.drawing) {
                    if (!this.raw_undo_list.hasOwnProperty(this.options.activePage)) {
                        this.raw_undo_list[this.options.activePage] = [];
                        this.raw_redo_list[this.options.activePage] = [];

                        this.raw_undo_ver_list[this.options.activePage] = [];
                        this.raw_redo_ver_list[this.options.activePage] = [];
                    }

                    if(this.raw_undo_ver_list.length === 0){
                        this.raw_undo_ver_list[this.options.activePage] = [];
                    }

                    if (this.raw_undo_list[this.options.activePage].length > 0) {
                        var tmpData = angular.copy(this.raw_undo_list[this.options.activePage]);
                        this.raw_undo_ver_list[this.options.activePage].push(tmpData);
                    }

                    var tmpArrUndoData = angular.copy(this.options.arrData);

                    if (tmpArrUndoData.name && tmpArrUndoData.name != '') {
                        if(factoryObj.text.options.isEditText == true && factoryObj.text.options.selectedObject >= 0) {
                          this.raw_undo_list[this.options.activePage][factoryObj.text.options.selectedObject] = tmpArrUndoData;  
                        } else {
                          this.raw_undo_list[this.options.activePage][this.raw_undo_list[this.options.activePage].length] = tmpArrUndoData;
                        }
                        this.options.undoFlag = true;
                    }

                    factoryObj.options.optionArrData = this.options.arrData = {
                        startX: [],
                        startY: [],
                        endX: [],
                        endY: [],
                        pencilData: []
                    };
                }
            },
            setRawData: function() {
                factoryObj.options.optionArrData.name = factoryObj.event.options.activeTool.name;
                factoryObj.options.optionArrData.startX.push(factoryObj.event.options.activeTool.options.startX);
                factoryObj.options.optionArrData.startY.push(factoryObj.event.options.activeTool.options.startY);
                factoryObj.options.optionArrData.endX.push(factoryObj.event.options.activeTool.options.endX);
                factoryObj.options.optionArrData.endY.push(factoryObj.event.options.activeTool.options.endY);
                factoryObj.options.optionArrData.font_size = this.options.font_size;
                factoryObj.options.optionArrData.fillStyle = this.options.fillStyle;
                factoryObj.options.optionArrData.lineWidth = this.options.lineWidth;

                if (factoryObj.options.optionArrData.name === "text") {
                    factoryObj.options.optionArrData.textInfo = factoryObj.event.options.activeTool.options.textInfo;
                    factoryObj.options.optionArrData.finalTextInfo = factoryObj.event.options.activeTool.options.finalTextInfo;
                }

                if (factoryObj.options.optionArrData.name === "image") {
                    factoryObj.options.optionArrData.imageURL = factoryObj.event.options.activeTool.options.uploadedImage[factoryObj.event.options.activeTool.options.uploadedImage.length - 1];
                    factoryObj.options.optionArrData.attachmentURL = factoryObj.event.options.activeTool.options.attachmentURL;
                    factoryObj.options.optionArrData.srcWidth = factoryObj.event.options.activeTool.options.srcWidth;
                    factoryObj.options.optionArrData.srcHeight = factoryObj.event.options.activeTool.options.srcHeight;
                }

                if (factoryObj.options.optionArrData.name === "circle") {
                    factoryObj.options.optionArrData.radius = factoryObj.event.options.activeTool.options.radius;
                }

                if (factoryObj.options.optionArrData.name === "pencil") {
                    factoryObj.options.optionArrData.pencilData.push({ x: factoryObj.event.options.activeTool.options.startX, y: factoryObj.event.options.activeTool.options.startY });
                }

                if (factoryObj.options.optionArrData.name === "line") {
                    factoryObj.options.optionArrData.lineAngle = Math.atan2(factoryObj.event.options.activeTool.options.endY - factoryObj.event.options.activeTool.options.startY, factoryObj.event.options.activeTool.options.endX - factoryObj.event.options.activeTool.options.startX);
                }

                if (factoryObj.options.optionArrData.name === "arrow") {
                    factoryObj.options.optionArrData.arrowAngle = Math.atan2(factoryObj.event.options.activeTool.options.endY - factoryObj.event.options.activeTool.options.startY, factoryObj.event.options.activeTool.options.endX - factoryObj.event.options.activeTool.options.startX);
                }

                this.options.arrData = angular.copy(factoryObj.options.optionArrData);
            },
            undo: function(canvas, ctx) {
                if (this.raw_undo_list.length > 0) {
                    this.options.action = 'undo';
                    this.restoreStateRawData(this.raw_undo_list, this.raw_redo_list);
                    this.redrawState(canvas, ctx);
                }
            },
            redo: function(canvas, ctx) {
                if (this.raw_redo_ver_list[this.options.activePage].length > 0) {
                    this.options.action = 'redo';
                    this.restoreStateRawData(this.raw_undo_list, this.raw_redo_list);
                    factoryObj.move.init(canvas, ctx);
                    this.redrawState(canvas, ctx);
                }
            },
            restoreState: function(canvas, ctx, pop, push) {
                var pageData = pop[this.options.activePage];
                if (pageData.length) {
                    if (push && this.options.action == 'undo') {
                        this.saveState(canvas, push, true);
                    }

                    if (this.options.action == 'undo') {
                        var restore_state = pageData.pop();
                        if (pageData.length) {
                            var imgSrc = pageData[pageData.length - 1];
                        } else {
                            var imgSrc = restore_state;
                        }
                    } else {
                        var restore_state = pageData.pop();
                        var imgSrc = restore_state;
                        this.undo_list[this.options.activePage].push(restore_state);
                    }

                    var img = document.createElement("img");
                    img.src = imgSrc;
                    img.onload = function () {
                        ctx.clearRect(0, 0, factoryObj.history.options.canvas_width, factoryObj.history.options.canvas_height);
                        ctx.drawImage(img, 0, 0, factoryObj.history.options.canvas_width, factoryObj.history.options.canvas_height);
                    };
                }
            },
            restoreStateRawData: function(pop, push) {
                var pageData = pop[this.options.activePage];
                if (this.options.action == 'undo') {
                    if (this.raw_undo_ver_list[this.options.activePage].length > 0) {
                        var tmpArrUndoData = angular.copy(pageData);
                        this.raw_redo_ver_list[this.options.activePage].push(tmpArrUndoData);
                        this.options.redoFlag = true;

                        if (this.raw_undo_ver_list[this.options.activePage].length > 0) {
                            var undoData = angular.copy(this.raw_undo_ver_list[this.options.activePage].pop());
                            this.raw_undo_list[this.options.activePage] = undoData;
                        }
                    } else {
                        if (this.options.undoFlag === true) {
                            var tmpArrUndoData = angular.copy(pageData);
                            this.raw_redo_ver_list[this.options.activePage].push(tmpArrUndoData);
                            this.raw_undo_list[this.options.activePage] = [];
                            this.options.undoFlag = false;
                        }
                    }
                    this.setButtonStyle();
                } else {
                    if (this.raw_redo_ver_list[this.options.activePage].length > 0) {
                        if (this.raw_undo_list[this.options.activePage].length > 0) {
                            var tmpArrUndoData = angular.copy(this.raw_undo_list[this.options.activePage]);
                            this.raw_undo_ver_list[this.options.activePage].push(tmpArrUndoData);
                        }
                        this.options.undoFlag = true;

                        if (this.raw_redo_ver_list[this.options.activePage].length > 0) {
                            var tmpArrRedoData = angular.copy(this.raw_redo_ver_list[this.options.activePage].pop());
                            var redoData = tmpArrRedoData;
                            this.raw_undo_list[this.options.activePage] = redoData;
                        }
                    } else {
                        if (this.options.redoFlag === true) {
                            var tmpArrRedoData = angular.copy(this.raw_redo_ver_list[this.options.activePage].pop());
                            var redoData = tmpArrRedoData;
                            this.raw_undo_list[this.options.activePage] = redoData;
                            this.options.redoFlag = false;
                        }
                    }
                    this.setButtonStyle();
                }
            },
            drawingState: function(canvas, ctx, pop) {
                if (pop[this.options.activePage].length) {
                    var restore_state = pop[this.options.activePage][pop[this.options.activePage].length - 1];
                    var img = document.createElement("img");
                    img.src = restore_state;
                    img.onload = function () {
                        factoryObj.event.options.activeTool.ctx.clearRect(0, 0, factoryObj.history.options.canvas_width, factoryObj.history.options.canvas_height);
                        factoryObj.event.options.activeTool.ctx.drawImage(img, 0, 0, factoryObj.history.options.canvas_width, factoryObj.history.options.canvas_height);
                        factoryObj.event.options.activeTool.drawTool();
                    };
                }
            },
            redrawState: function(canvas, ctx) {
                if (this.initial_canvas_url[this.options.activePage]) {
                    var restore_state = this.initial_canvas_url[this.options.activePage];
                    var img = document.createElement("img");
                    img.src = restore_state;
                    img.onload = function () {
                        //factoryObj.move.init(factoryObj.options.canvas, factoryObj.options.ctx)
                        factoryObj.move.ctx.clearRect(0, 0, factoryObj.history.options.canvas_width, factoryObj.history.options.canvas_height);
                        factoryObj.move.ctx.drawImage(img, 0, 0, factoryObj.history.options.canvas_width, factoryObj.history.options.canvas_height);

                        //if (factoryObj.history.raw_undo_list[factoryObj.history.options.activePage].length > 0) {
                        factoryObj.move.redrawTool();
                        //}
                    };
                }
            },
            manageActiveBtn: function(btn) {
                var activeObj = document.getElementsByClassName('controller active');
                for (var x = 0; x < activeObj.length; x++) {
                    activeObj[x].classList.remove('active');
                }
                if (btn !== '') {
                    document.getElementById(btn).className += ' active';
                    if (btn !== 'clear_image') {
                        factoryObj.options.toolsObj.frm_canvas_tool.reset();
                    }
                }
            }
        };

        factoryObj.event = {
            options: {
                activeTool: ''
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.canvas_coords = this.canvas.getBoundingClientRect();
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                if(factoryObj.options.fileType === 'pdf') {
                    this.paging();
                }
                this.addCanvasEvents();
            },
            addCanvasEvents: function() {
                this.canvas.addEventListener('mousedown', this.start.bind(this));
                this.canvas.addEventListener('mousemove', this.stroke.bind(this));
                this.canvas.addEventListener('mouseup', this.stop.bind(this));
                this.canvas.addEventListener('mouseout', this.stop.bind(this));
            },
            start: function(evt) {
                if (factoryObj.history.raw_undo_list[factoryObj.history.options.activePage].length > 0) {
                    factoryObj.move.init(this.canvas, this.ctx);
                    factoryObj.move.start(evt);
                    factoryObj.move.drawing = true;
                }

                if (factoryObj.move.options.movedObject == -1) {
                    if (this.options.activeTool !== '' && this.options.activeTool !== undefined) {
                        this.options.activeTool.start(evt);
                    }
                }
            },
            stroke: function(evt) {
                if ((this.options.activeTool !== '' && this.options.activeTool !== undefined && this.options.activeTool.drawing === true) || this.options.activeTool.name == 'move') {
                    this.options.activeTool.stroke(evt);
                }
            },
            stop: function(evt) {
                if (this.options.activeTool !== '' && this.options.activeTool !== undefined && this.options.activeTool.drawing === true) {
                    this.options.activeTool.stop(evt);
                }
            },
            closepdf: function() {
                factoryObj.options.closeFn();
            },
            savepdf: function(action) {
                var page = 0;
                if(factoryObj.options.fileType === 'pdf') {
                    var doc = new jsPDF('p', 'mm', 'a4');
                    for (page = 0; page < parseInt(factoryObj.history.options.totalPage); page++) {
                        if (page < 2) {
                            this.options.isSave = true;
                            factoryObj.move.init(this.canvas, this.ctx);
                            factoryObj.move.redrawTool();
                            if (factoryObj.history.final_canvas_url.hasOwnProperty(page)) {
                                var imgData = factoryObj.history.final_canvas_url[page];
                            } else {
                                var imgData = document.getElementById("page" + page).toDataURL("image/png");
                            }
                            doc.addImage(imgData, 'PNG', 0, 0, 200, 250, null, 'SLOW');
                            if (page < parseInt(factoryObj.history.options.totalPage - 1)) {
                                doc.addPage();
                            }

                            this.options.isSave = false;
                        }
                    }

                    var dataurl = doc.output('datauristring');
                } else {
                    if (factoryObj.history.final_canvas_url.hasOwnProperty(page)) {
                        var dataurl = factoryObj.history.final_canvas_url[page];
                    } else {
                        var dataurl = document.getElementById("page" + page).toDataURL("image/png");
                    }
                }
                var blob = this.dataURLtoBlob(dataurl);

                if (typeof factoryObj.options.callbackFn == "function") {
                    factoryObj.options.callbackFn({ blob: blob,flag:action,actionListObj: factoryObj.history.raw_undo_list, deletedAttachment: factoryObj.history.deletedAttachmentArr });
                } else {
                    doc.save();
                }
            },
            dataURLtoBlob: function(dataurl) {
                var arr = dataurl.split(','),
                    mime = arr[0].match(/:(.*?);/)[1],
                    bstr = atob(arr[1]),
                    n = bstr.length,
                    u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                return new Blob([u8arr], { type: mime });
            },
            paging: function() {
                factoryObj.history.options.totalPage = factoryObj.history.options.pdfobj.transport.numPages;
                factoryObj.options.toolsObj.activePage.textContent = factoryObj.history.options.activePage + 1;
                factoryObj.options.toolsObj.currentPage.value = factoryObj.history.options.activePage + 1;
                factoryObj.options.toolsObj.totalPage.textContent = factoryObj.history.options.totalPage;
                if (factoryObj.history.options.totalPage > 1) {
                    if (factoryObj.history.options.activePage === 0) {
                        factoryObj.options.toolsObj.prevBtn.setAttribute('disabled', 'disabled');
                        factoryObj.options.toolsObj.nextBtn.removeAttribute('disabled');
                    } else if (parseInt(factoryObj.history.options.activePage) === parseInt(factoryObj.history.options.totalPage - 1)) {
                        factoryObj.options.toolsObj.nextBtn.setAttribute('disabled', 'disabled');
                        factoryObj.options.toolsObj.prevBtn.removeAttribute('disabled');
                    } else if (factoryObj.history.options.activePage > 0 && parseInt(factoryObj.history.options.activePage) < parseInt(factoryObj.history.options.totalPage - 1)) {
                        factoryObj.options.toolsObj.prevBtn.removeAttribute('disabled');
                        factoryObj.options.toolsObj.nextBtn.removeAttribute('disabled');
                    }
                } else {
                    factoryObj.options.toolsObj.nextBtn.setAttribute('disabled', 'disabled');
                    factoryObj.options.toolsObj.prevBtn.setAttribute('disabled', 'disabled');
                }
            },
            removeObject: function() {
                if(factoryObj.move.options.selectedObject > -1) {
                    factoryObj.history.saveState(this.canvas);
                    if(factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][factoryObj.move.options.selectedObject].name === 'image') {
                        factoryObj.history.deletedAttachmentArr.push(factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][factoryObj.move.options.selectedObject].attachmentURL);
                    }
                    if(typeof(factoryObj.history.raw_undo_list[factoryObj.history.options.activePage]) == 'object') {
                        delete factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][factoryObj.move.options.selectedObject];
                    } else {
                        factoryObj.history.raw_undo_list[factoryObj.history.options.activePage].splice(factoryObj.move.options.selectedObject, 1);
                    }

                    factoryObj.move.options.selectedObject = -1;
                    factoryObj.move.options.isSelectedObj = false;
                    this.ctx.setLineDash([0, 0]);
                    factoryObj.history.redrawState(this.canvas, this.ctx);
                    factoryObj.options.optionArrData = factoryObj.history.options.arrData = {
                        startX: [],
                        startY: [],
                        endX: [],
                        endY: [],
                        pencilData: []
                    };
                }
            }
        };

        factoryObj.text = {
            name: 'text',
            options: {
                stroke_color: ['00', '00', '00'],
                fill_color: '#FF0000',
                font: '18px Arial',
                dim: 4,
                lineHeight: 14,
                finalTextInfo: [],
                width: 250,
                height: 250
            },
            init: function(canvas, ctx) {
                if(this.options.isEditText) return ;
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                //this.ctx.fillStyle = 'rgba(0,0,0,0)';
                
                this.drawing = false;
                this.options.flag = true;
            },
            start: function(evt) {
                if (!this.options.flag) return;
                this.options.selectedObject = -1;
                
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;

                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.fillStyle = this.options.fill_color;
                this.ctx.font = this.options.font;

                this.ctx.beginPath();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (!this.options.flag) return;
                if (this.drawing) {
                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;
                    this.options.endX = x;
                    this.options.endY = y;
                }
            },
            stop: function(evt) {
                /*if(this.drawing && this.options.flag && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {*/
                this.drawing = false;
                this.options.flag = false;
                this.options.lineHeight = parseInt(factoryObj.history.options.font_size);
                factoryObj.options.toolsObj.editor_wrapper.style.display = 'block';
                factoryObj.options.toolsObj.editor_wrapper.style.top = parseInt(this.options.startY) + 'px';
                factoryObj.options.toolsObj.editor_wrapper.style.left = this.options.startX + 'px';
                factoryObj.options.toolsObj.editor_wrapper.style.width = this.options.width + 'px';
                factoryObj.options.toolsObj.contenteditor.focus();
                factoryObj.options.toolsObj.contenteditor.style.height = 'auto';
                this.options.finalTextInfo = [];
                /*} else {
                 this.ctx.closePath();
                 this.ctx.stroke();
                 this.drawing = false;
                 }*/
            },
            drawTool: function() {
                if(this.options.isEditText == true) {
                  this.options.startX = this.options.tmpTextData.startX[0];
                  this.options.startY = this.options.tmpTextData.startY[0];

                  this.options.endX = this.options.tmpTextData.endX[0];
                  this.options.endY = this.options.tmpTextData.endY[0];

                  this.ctx.fillStyle = this.options.tmpTextData.fillStyle;
                  this.ctx.font = this.options.tmpTextData.font_size;
                  this.options.width = this.options.tmpTextData.endX[0] - this.options.tmpTextData.startX[0]; 
                } else {
                  factoryObj.history.setStyleElement(this.canvas, this.ctx);
                  factoryObj.options.toolsObj.contenteditor.style.fontSize = factoryObj.history.options.font_size;
                  factoryObj.options.toolsObj.contenteditor.style.lineHeight = factoryObj.history.options.font_size + 'px';
                  factoryObj.options.toolsObj.contenteditor.style.height = factoryObj.options.toolsObj.contenteditor.scrollHeight + "px";
                /*factoryObj.options.toolsObj.contenteditor.style.width = this.options.width + "px";*/
                }

                var contenttext = factoryObj.options.toolsObj.contenteditor.value;
                var enteredTextEncoded = escape(contenttext);
                contenttext = unescape(enteredTextEncoded.replace(/%0A/g, '<br />').replace(/%20/g, ' '));
                factoryObj.options.toolsObj.contenteditor.value = '';

                if (parseInt(factoryObj.options.toolsObj.contenteditor.style.width) != '' && parseInt(factoryObj.options.toolsObj.contenteditor.style.width) > 0) {
                    factoryObj.options.toolsObj.contenteditor.style.width = parseInt(factoryObj.options.toolsObj.contenteditor.style.width);
                } else {
                    factoryObj.options.toolsObj.contenteditor.style.width = parseInt(this.options.width);
                }

                if (contenttext !== '') {
                    var textObj = {
                        text: contenttext,
                        x: this.options.startX + 10,
                        y: this.options.startY + 20,
                        boxWidth: parseInt(factoryObj.options.toolsObj.contenteditor.style.width)
                    };
                    this.drawStyledText(textObj);
                }
                this.options.flag = true;
                
            },
            editText: function() {
                //factoryObj.history.setRawData();
                //factoryObj.history.saveState(this.canvas);
                factoryObj.event.options.activeTool = factoryObj.text;
                this.options.selectedObject = factoryObj.move.options.selectedObject;
                
                this.options.tmpTextData = angular.copy(factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.selectedObject]);
                this.options.startX = this.options.tmpTextData.startX[0];
                this.options.startY = this.options.tmpTextData.startY[0];

                this.options.endX = this.options.tmpTextData.endX[0];
                this.options.endY = this.options.tmpTextData.endY[0];
                
                this.options.width = this.options.tmpTextData.endX[0] - this.options.tmpTextData.startX[0];

                this.ctx.fillStyle = this.options.tmpTextData.fillStyle;
                this.ctx.font = this.options.tmpTextData.font_size;
                
                factoryObj.options.toolsObj.contenteditor.value = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.selectedObject].textInfo.text.replace(/<br\s?\/?>/g,"\n");
                //factoryObj.history.redrawState(this.canvas, this.ctx);

                this.ctx.beginPath();
                this.options.isEditText = true;
                this.drawing = true;
                this.stop();
                
            },
            drawStyledText: function(textInfo) {
                this.options.textInfo = textInfo;
                var text = textInfo.text,
                    x = textInfo.x,
                    y = textInfo.y;
                var splittedText,
                    xAux,
                    textLines = [],
                    boxWidth = textInfo.boxWidth;
                var proText, k, n, m;

                var match = text.match(/<\s*br\s*\/>|<\s*class=["|']([^"|']+)["|']\s*\>([^>]+)<\s*\/class\s*\>|<\s*style=["|']([^"|']+)["|']\s*\>([^>]+)<\s*\/style\s*\>|[^<]+/g);

                for (m = 0; m < match.length; m++) {

                    if (/<\s*br\s*\/>/i.test(match[m])) {
                        y += parseInt(this.options.lineHeight, 10) * 1.5;
                        x = textInfo.x;
                        continue;
                    } else {
                        proText = match[m];
                    }

                    textLines = [];
                    proText = proText.replace(/\s*\n\s*/g, " ");

                    if (boxWidth !== undefined) {

                        if (this.checkLineBreak(proText, boxWidth + textInfo.x, x)) {
                            splittedText = this.trim(proText).split(" ");

                            if (splittedText.length == 1) {
                                textLines.push({ text: this.trim(proText) + " ", linebreak: true });
                            } else {
                                xAux = x;
                                var line = 0;
                                textLines[line] = { text: undefined, linebreak: false };

                                for (k = 0; k < splittedText.length; k++) {
                                    splittedText[k] += " ";
                                    if (!this.checkLineBreak(splittedText[k], boxWidth + textInfo.x, xAux)) {
                                        if (textLines[line].text == undefined) {
                                            textLines[line].text = splittedText[k];
                                        } else {
                                            textLines[line].text += splittedText[k];
                                        }

                                        xAux += this.ctx.measureText(splittedText[k]).width;
                                    } else {
                                        xAux = textInfo.x;
                                        if (textLines[line].text !== undefined) {
                                            line++;
                                        }

                                        textLines[line] = { text: splittedText[k], linebreak: true };
                                        xAux += this.ctx.measureText(splittedText[k]).width;
                                    }
                                }
                            }
                        }
                    }

                    if (textLines.length == 0) {
                        textLines.push({ text: this.trim(proText) + " ", linebreak: false });
                    }

                    for (n = 0; n < textLines.length; n++) {
                        if (textLines[n].linebreak) {
                            y += parseInt(this.options.lineHeight, 10);
                            x = textInfo.x;

                            this.options.endY = y;
                        }
                        this.ctx.fillText(textLines[n].text, x, y);
                        this.options.finalTextInfo.push({ 'text': textLines[n].text, 'x': x, 'y': y });
                        x += this.ctx.measureText(textLines[n].text).width;
                    }
                }

                factoryObj.square.canvas = this.canvas;
                factoryObj.square.ctx = this.ctx;
                factoryObj.square.options.startX = this.options.startX;
                factoryObj.square.options.startY = this.options.startY;
                factoryObj.square.options.endX = this.options.startX + parseInt(factoryObj.options.toolsObj.contenteditor.style.width);
                factoryObj.square.options.endY = y + 10;
                factoryObj.square.drawTool();

                //this.options.startX = this.options.startX;
                //this.options.startY = this.options.startY;
                this.options.endX = this.options.startX + parseInt(factoryObj.options.toolsObj.contenteditor.style.width);
                this.options.endY = y + 10;

                this.ctx.stroke();
                factoryObj.event.options.activeTool.name = 'text';
                factoryObj.event.options.activeTool.options.finalTextInfo = this.options.finalTextInfo;
                factoryObj.history.setRawData();
                factoryObj.history.saveState(this.canvas);
                if(this.options.isEditText == true) {
                  this.options.isEditText = false;
                  this.options.selectedObject = -1;
                  factoryObj.history.redrawState();
                  this.options.flag = false;
                }
            },
            redrawTool: function(obj, diffX, diffY) {
                for (var k = 0; k < obj.length; k++) {
                    this.ctx.fillText(obj[k].text, obj[k].x + diffX, obj[k].y + diffY);
                }

                factoryObj.square.canvas = this.canvas;
                factoryObj.square.ctx = this.ctx;
                factoryObj.square.options.startX = this.options.startX;
                factoryObj.square.options.startY = this.options.startY;
                factoryObj.square.options.endX = this.options.endX;
                factoryObj.square.options.endY = this.options.endY;
                factoryObj.square.drawTool();
            },
            checkLineBreak: function(text, boxWidth, x) {
                return this.ctx.measureText(text).width + x > boxWidth;
            },
            trim: function(str) {
                var ws, i;
                str = str.replace(/^\s\s*/, '');
                ws = /\s/;
                i = str.length;
                while (ws.test(str.charAt(--i))) {
                    continue;
                }
                return str.slice(0, i + 1);
            }
        };

        factoryObj.image = {
            name: 'image',
            options: {
                activeImage: '',
                attachmentURL: '',
                uploadedImage: [],
                width: '',
                height: '',
                wdthHghtRatio: '',
                img: '',
                srcWidth:'',
                srcHeight:''
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                this.drawing = false;
            },
            start: function(evt) {
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;

                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.beginPath();
                /*if(this.options.img != '') {
                 this.drawing = true;
                 }*/
            },
            stroke: function(evt) {
                if (this.drawing) {
                    factoryObj.history.drawingState(this.canvas, this.ctx, factoryObj.history.undo_list);

                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;

                    this.options.endX = x;
                    this.options.endY = y;

                    this.drawTool();
                }
            },
            stop: function(evt) {
                if (this.drawing && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {
                    this.ctx.beginPath();
                    this.drawTool();
                    this.ctx.closePath();
                    this.ctx.stroke();

                    this.drawing = false;
                    factoryObj.history.setRawData();
                    factoryObj.history.saveState(this.canvas);
                } else {
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.drawing = false;
                }
            },
            calculateAspectRatioFit: function(srcWidth, srcHeight, maxWidth, maxHeight) {
                var ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
                var rtnWidth = srcWidth*ratio;
                var rtnHeight = srcHeight*ratio;
                return { width: rtnWidth, height: rtnHeight };
            },
            drawTool: function() {
                this.ctx.beginPath();

                factoryObj.history.setStyleElement(this.canvas, this.ctx);
                this.options.width = parseInt(this.options.endX - this.options.startX);
                this.options.height = parseInt(this.options.endY - this.options.startY);

                var imgSize = this.calculateAspectRatioFit(this.options.srcWidth, this.options.srcHeight,  this.options.width, this.options.height);
                this.ctx.drawImage(this.options.img, this.options.startX, this.options.startY, imgSize.width, imgSize.height);
                this.ctx.closePath();

                if (!factoryObj.event.options.isSave) {
                    this.ctx.beginPath();
                    this.ctx.lineWidth = 3;
                    this.ctx.strokeStyle = '#000000';
                    this.ctx.rect(this.options.startX + 2, this.options.startY + 2, imgSize.width - 4,imgSize.height - 4);
                    this.ctx.stroke();

                    this.ctx.closePath();

                    this.ctx.beginPath();
                    this.ctx.lineWidth = 1;
                    this.ctx.fillStyle = '#FFFFFF';
                    factoryObj.image.options.endX = factoryObj.image.options.startX + imgSize.width;
                    factoryObj.image.options.endY = factoryObj.image.options.startY + imgSize.height;
                    this.ctx.rect(factoryObj.image.options.startX, factoryObj.image.options.startY, 8, 8);
                    this.ctx.rect(factoryObj.image.options.startX, factoryObj.image.options.endY - 8, 8, 8);
                    this.ctx.rect(factoryObj.image.options.endX - 8, factoryObj.image.options.endY - 8, 8, 8);
                    this.ctx.rect(factoryObj.image.options.endX - 8, factoryObj.image.options.startY, 8, 8);

                    this.ctx.rect(factoryObj.image.options.endX - imgSize.width, factoryObj.image.options.endY - parseInt(imgSize.height / 2) - 8, 8, 8);
                    this.ctx.rect(factoryObj.image.options.endX - 8, factoryObj.image.options.endY - parseInt(imgSize.height / 2) - 8, 8, 8);
                    this.ctx.rect(factoryObj.image.options.endX - parseInt(imgSize.width / 2) - 8, factoryObj.image.options.endY - 8, 8, 8);
                    this.ctx.rect(factoryObj.image.options.endX - parseInt(imgSize.width / 2) - 8, factoryObj.image.options.endY - imgSize.height, 8, 8);

                    this.ctx.fill();
                    this.ctx.stroke();
                    this.ctx.closePath();
                }
            },
            uploadImage: function(frmData) {
                var img = new Image();

                img.onload = function (obj) {
                    factoryObj.image.options.startX = 10;
                    factoryObj.image.options.startY = 10;
                    factoryObj.image.options.endX = this.width + 10;
                    factoryObj.image.options.endY = this.height + 10;
                    factoryObj.image.options.srcWidth = this.width;
                    factoryObj.image.options.srcHeight = this.height;
                    factoryObj.image.ctx.beginPath();
                    //factoryObj.image.drawing = true;
                    factoryObj.history.drawingState(factoryObj.image.canvas, factoryObj.image.ctx, factoryObj.history.undo_list);
                    factoryObj.image.drawTool();
                    factoryObj.image.ctx.closePath();
                    //factoryObj.image.ctx.stroke();

                    /* Add image to attachment function call */
                    var tempCanvas = document.createElement('canvas');
                    tempCanvas.width = this.width;
                    tempCanvas.height = this.height;
                    tempCanvas.srcWidth = this.width;
                    tempCanvas.srcHeight = this.height;
                    tempCanvas.getContext('2d').drawImage(this, 0, 0);
                    factoryObj.image.options.imageURL = tempCanvas.toDataURL('image/png');
                    factoryObj.image.options.uploadedImage.push(factoryObj.image.options.imageURL);
                    /** End Attachment */
                    factoryObj.options.saveAttachment({imageBlobObj :tempCanvas.toDataURL('image/png'), callback: function(url){
                        factoryObj.image.options.attachmentURL = url;
                        factoryObj.image.drawing = false;
                        factoryObj.history.setRawData();
                        factoryObj.history.saveState(factoryObj.image.canvas);
                        factoryObj.options.toolsObj.frm_canvas_tool.reset();
                    }});
                };

                img.src = URL.createObjectURL(frmData);

                this.options.img = img;
            },
            resetImage: function() {
                this.options.img = '';
            }
        };

        factoryObj.arrow = {
            name: 'arrow',
            options: {
                stroke_color: ['00', '00', '00'],
                dim: 4,
                arrow: { h: 5, w: 10 },
                headlen: 10
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                this.ctx.fillStyle = 'rgba(0,0,0,0)';
                this.drawing = false;
            },
            start: function(evt) {
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;

                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.beginPath();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (this.drawing) {
                    factoryObj.history.drawingState(this.canvas, this.ctx, factoryObj.history.undo_list);

                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;

                    this.options.endX = x;
                    this.options.endY = y;

                    this.drawTool();
                }
            },
            stop: function(evt) {
                if (this.drawing && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {
                    this.ctx.beginPath();
                    this.drawTool();
                    this.ctx.closePath();
                    this.ctx.stroke();

                    this.drawing = false;
                    factoryObj.history.setRawData();
                    factoryObj.history.saveState(this.canvas);
                } else {
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.drawing = false;
                }
            },
            drawTool: function() {
                this.ctx.beginPath();

                factoryObj.history.setStyleElement(this.canvas, this.ctx);

                var angle = Math.atan2(this.options.endY - this.options.startY, this.options.endX - this.options.startX);
                this.ctx.moveTo(this.options.startX, this.options.startY);
                this.ctx.lineTo(this.options.endX, this.options.endY);
                this.ctx.lineTo(this.options.endX - this.options.headlen * Math.cos(angle - Math.PI / 6), this.options.endY - this.options.headlen * Math.sin(angle - Math.PI / 6));
                this.ctx.moveTo(this.options.endX, this.options.endY);
                this.ctx.lineTo(this.options.endX - this.options.headlen * Math.cos(angle + Math.PI / 6), this.options.endY - this.options.headlen * Math.sin(angle + Math.PI / 6));
                this.ctx.stroke();
            }
        };

        factoryObj.line = {
            name: 'line',
            options: {
                stroke_color: ['00', '00', '00'],
                dim: 4
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                this.ctx.fillStyle = 'rgba(0,0,0,0)';
                this.drawing = false;
            },
            start: function(evt) {
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;

                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.beginPath();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (this.drawing) {
                    factoryObj.history.drawingState(this.canvas, this.ctx, factoryObj.history.undo_list);

                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;

                    this.options.endX = x;
                    this.options.endY = y;

                    this.drawTool();
                }
            },
            stop: function(evt) {
                if (this.drawing && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {
                    this.ctx.beginPath();
                    this.drawTool();
                    this.ctx.closePath();
                    this.ctx.stroke();

                    this.drawing = false;
                    factoryObj.history.setRawData();
                    factoryObj.history.saveState(this.canvas);
                } else {
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.drawing = false;
                }
            },
            drawTool: function() {
                this.ctx.beginPath();

                factoryObj.history.setStyleElement(this.canvas, this.ctx);

                this.ctx.moveTo(this.options.startX, this.options.startY);
                this.ctx.lineTo(this.options.endX, this.options.endY);
                this.ctx.stroke();
            },
            redrawTool: function() {
                this.ctx.beginPath();

                factoryObj.history.setStyleElement(this.canvas, this.ctx);

                this.ctx.moveTo(this.options.startX, this.options.startY);
                this.ctx.lineTo(this.options.endX, this.options.endY);
                this.ctx.stroke();
            }
        };

        factoryObj.circle = {
            name: 'circle',
            options: {
                stroke_color: ['00', '00', '00'],
                dim: 4
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                this.ctx.fillStyle = 'rgba(0,0,0,0)';
                this.drawing = false;
            },
            start: function(evt) {
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;

                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.beginPath();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (this.drawing) {
                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;
                    this.options.endX = x;
                    this.options.endY = y;
                    factoryObj.history.drawingState(this.canvas, this.ctx, factoryObj.history.undo_list);
                }
            },
            stop: function(evt) {
                if (this.drawing && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {
                    this.drawTool();
                    this.ctx.closePath();
                    this.ctx.stroke();

                    this.drawing = false;
                    factoryObj.history.setRawData();
                    factoryObj.history.saveState(this.canvas);
                } else {
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.drawing = false;
                }
            },
            drawTool: function() {
                if (this.drawing) {
                    factoryObj.history.setStyleElement(this.canvas, this.ctx);

                    var h = parseInt(this.options.endX - this.options.startX);
                    var k = parseInt(this.options.endY - this.options.startY);
                    var r = h + k;
                    var step = 2 * Math.PI / r;

                    this.options.radius = r;
                    this.ctx.beginPath();

                    for (var theta = 0; theta < 2 * Math.PI; theta += step) {
                        var x = h + r * Math.cos(theta);
                        var y = k - r * Math.sin(theta);
                        this.ctx.lineTo(x + this.options.startX, y + this.options.startY);
                    }
                    this.ctx.stroke();
                }
            }
        };

        factoryObj.ellipse = {
            name: 'ellipse',
            options: {
                stroke_color: ['00', '00', '00'],
                dim: 4
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.stroke_color;
                this.ctx.fillStyle = 'rgba(0,0,0,0)';
                this.drawing = false;
            },
            start: function(evt) {
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;

                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.beginPath();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (this.drawing) {
                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;
                    this.options.endX = x;
                    this.options.endY = y;
                    factoryObj.history.drawingState(this.canvas, this.ctx, factoryObj.history.undo_list);
                }
            },
            stop: function(evt) {
                if (this.drawing && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {
                    this.drawTool();
                    this.ctx.closePath();
                    this.ctx.stroke();

                    this.drawing = false;
                    factoryObj.history.setRawData();
                    factoryObj.history.saveState(this.canvas);
                } else {
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.drawing = false;
                }
            },
            drawTool: function() {
                if (this.drawing) {
                    factoryObj.history.setStyleElement(this.canvas, this.ctx);

                    this.ctx.beginPath();
                    for (m = 0 * Math.PI; m < 2 * Math.PI; m += 0.01) {
                        xPos = Math.floor(this.options.startX - parseInt(this.options.endX - this.options.startX) * Math.cos(m));
                        yPos = Math.floor(this.options.startY + parseInt(this.options.endY - this.options.startY) * Math.sin(m));

                        if (m == 0) {
                            this.ctx.moveTo(xPos, yPos);
                        } else {
                            this.ctx.lineTo(xPos, yPos);
                        }
                    }

                    this.ctx.stroke();
                }
            }
        };

        factoryObj.pencil = {
            name: 'pencil',
            options: {
                stroke_color: ['00', '00', '00'],
                dim: 4
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.ctx.strokeColor = this.options.fillStyle;
                this.drawing = false;
            },
            start: function(evt) {
                factoryObj.history.setStyleElement(this.canvas, this.ctx);
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;
                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = 0;
                this.options.endY = 0;
                this.ctx.beginPath();
                this.ctx.moveTo(this.options.startX, this.options.startY);
                factoryObj.history.setRawData();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (this.drawing) {
                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;
                    this.options.startX = x;
                    this.options.startY = y;
                    this.options.endX = 0;
                    this.options.endY = 0;
                    this.ctx.lineTo(this.options.startX, this.options.startY);
                    factoryObj.history.setRawData();
                    this.ctx.stroke();
                }
            },
            stop: function(evt) {
                if (this.drawing) {
                    this.drawing = false;
                    factoryObj.history.saveState(this.canvas);
                }
            },
            drawTool: function() {},
            redrawTool: function() {
                this.ctx.beginPath();

                for (var l = 0; l < this.options.pencilData.length; l++) {

                    if (l == 0) {
                        this.ctx.moveTo(this.options.pencilData[l].x + this.options.diffX, this.options.pencilData[l].y + this.options.diffY);
                    } else {
                        this.ctx.lineTo(this.options.pencilData[l].x + this.options.diffX, this.options.pencilData[l].y + this.options.diffY);
                    }
                }
                this.ctx.stroke();
            }
        };

        factoryObj.move = {
            name: 'move',
            options: {
                arrTool: ['square', 'circle', 'text', 'image', 'line', 'arrow', 'ellipse'],
                prevTool: '',
                movedObject: -1,
                cursorStyle: 'move',
                isResize: false,
                arrResize: { startX: false, startY: false, endX: false, endY: false },
                resizeMargin: 10
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.canvas_coords = this.canvas.getBoundingClientRect();
                this.ctx = ctx;
                this.drawing = false;
            },
            start: function(evt) {
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;
                this.options.startX = x;
                this.options.startY = y;

                this.options.startDiffX = evt.pageX;
                this.options.startDiffY = evt.pageY;
                this.options.cursorStyle = 'move';
                this.options.isClicked = true;

                this.options.diffX = 0;
                this.options.diffY = 0;

                if(this.options.selectedObject > -1) {
                    this.options.selectedObject = -1;
                    this.options.movedObject = -1;
                    this.options.isSelectedObj = false;
                    this.redrawTool();
                }

                //factoryObj.history.redrawState();
                this.hitTest();
                if(this.options.movedObject > -1) {
                    this.options.selectedObject = this.options.movedObject;
                    factoryObj.history.redrawState();
                }

                if (this.options.movedObject >= 0) {
                    this.options.prevTool = factoryObj.event.options.activeTool;
                    factoryObj.event.options.activeTool = factoryObj.move;
                } else {
                    return true;
                }

                factoryObj.options.toolsObj.canvas.style.cursor = this.options.cursorStyle;
                this.drawing = true;
            },
            stroke: function(evt) {
                this.options.isClicked = false;
                if (this.drawing) {
                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;

                    this.options.endX = x;
                    this.options.endY = y;

                    this.options.endDiffX = evt.pageX;
                    this.options.endDiffY = evt.pageY;

                    this.options.diffX = this.options.endDiffX - this.options.startDiffX;
                    this.options.diffY = this.options.endDiffY - this.options.startDiffY;

                    factoryObj.history.redrawState(this.canvas, this.ctx);
                }
            },
            stop: function(evt) {
                if (this.drawing) {

                    this.drawing = false;

                    if (this.options.movedObject >= 0 && (this.options.startX - this.options.endX !== 0 || this.options.startY - this.options.endY !== 0) && this.options.endX != undefined) {
                        factoryObj.history.tmp_raw_undo_list = angular.copy(factoryObj.history.raw_undo_list[factoryObj.history.options.activePage]);

                        if (this.options.arrTool.indexOf(factoryObj.history.options.arrData.name) > -1) {
                            if (this.options.isResize === false) {
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0] + this.options.diffX;
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0] + this.options.diffY;
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0] + this.options.diffX;
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0] + this.options.diffY;
                            } else {
                                if (this.options.arrResize.startX === true) {
                                    factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0] + this.options.diffX;
                                }

                                if (this.options.arrResize.startY === true) {
                                    factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0] + this.options.diffY;
                                }

                                if (this.options.arrResize.endX === true) {
                                    factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0] + this.options.diffX;
                                }

                                if (this.options.arrResize.endY === true) {
                                    factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0] = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0] + this.options.diffY;
                                }
                            }

                            if (factoryObj.history.options.arrData.name == 'text') {
                                for (var k = 0; k < factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].finalTextInfo.length; k++) {
                                    factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].finalTextInfo[k].x = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].finalTextInfo[k].x + this.options.diffX;
                                    factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].finalTextInfo[k].y = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].finalTextInfo[k].y + this.options.diffY;
                                }

                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].textInfo.x += this.options.diffX;
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].textInfo.y += this.options.diffY;
                            }
                        } else {
                            for (var k = 0; k < factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].pencilData.length; k++) {
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].pencilData[k].x = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].pencilData[k].x + this.options.diffX;
                                factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].pencilData[k].y = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].pencilData[k].y + this.options.diffY;
                            }
                        }
                    }

                    factoryObj.options.optionArrData = factoryObj.history.options.arrData = {
                        startX: [],
                        startY: [],
                        endX: [],
                        endY: [],
                        pencilData: []
                    };

                    if(this.options.isClicked === false) {
                        factoryObj.history.saveState(this.canvas);
                    }
                    this.options.movedObject = -1;
                    this.options.cursorStyle = 'default';
                    factoryObj.options.toolsObj.canvas.style.cursor = this.options.cursorStyle;

                    this.options.arrResize = { startX: false, startY: false, endX: false, endY: false };
                    this.options.isResize = false;

                    if (this.options.prevTool != '') {
                        factoryObj.event.options.activeTool = this.options.prevTool;
                        this.options.prevTool = '';
                    }
                }

                this.options.isClicked = false;
            },
            drawTool: function() {
                this.ctx.beginPath();
                if (this.drawing) {
                    var reDrawTool = factoryObj.history.options.arrData.name;
                    if (reDrawTool === 'square') {
                        factoryObj.square.init(this.canvas, this.ctx);
                        factoryObj.square.options.startX = factoryObj.history.options.arrData.startX[0] + this.options.diffX;
                        factoryObj.square.options.startY = factoryObj.history.options.arrData.startY[0] + this.options.diffY;
                        factoryObj.square.options.endX = factoryObj.history.options.arrData.endX[0] + this.options.diffX;
                        factoryObj.square.options.endY = factoryObj.history.options.arrData.endY[0] + this.options.diffY;
                        factoryObj.square.drawTool();
                    }
                }
                this.ctx.stroke();
            },
            redrawTool: function() {
                if(factoryObj.history.raw_undo_list[factoryObj.history.options.activePage].length > 0) {
                    var tmpData = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage];
                    var cntStart = tmpData.length - 1;

                    if (cntStart >= 0) {
                        for (i = 0; i <= cntStart; i++) {
                            if(tmpData[i] === undefined || tmpData[i] === null) {
                                continue;
                            }
                            this.ctx.beginPath();

                            if(this.options.selectedObject == i) {
                                this.options.isSelectedObj = true;
                                this.ctx.setLineDash([5, 5]);
                            } else {
                                this.options.isSelectedObj = false;
                                this.ctx.setLineDash([0, 0]);
                            }

                            factoryObj.history.options.font_size = tmpData[i].font_size;
                            factoryObj.history.options.fillStyle = tmpData[i].fillStyle;
                            factoryObj.history.options.lineWidth = tmpData[i].lineWidth;
                            factoryObj.history.setStyleElement(this.canvas, this.ctx);
                            if (this.options.arrTool.indexOf(tmpData[i].name) > -1) {
                                if (tmpData[i].name === 'square') {
                                    this.options.currentDrawTool = factoryObj.square;
                                }

                                if (tmpData[i].name === 'circle') {
                                    this.options.currentDrawTool = factoryObj.circle;
                                }

                                if (tmpData[i].name === 'image') {
                                    this.options.currentDrawTool = factoryObj.image;
                                    this.options.currentDrawTool.options.img = tmpData[i].imageURL;
                                    this.options.currentDrawTool.options.srcWidth = tmpData[i].srcWidth;
                                    this.options.currentDrawTool.options.srcHeight = tmpData[i].srcHeight;
                                    var img = new Image();

                                    img.onload = function (obj) {};

                                    img.src = this.options.currentDrawTool.options.img;
                                    this.options.currentDrawTool.options.img = img;
                                }

                                if (tmpData[i].name === 'line') {
                                    this.options.currentDrawTool = factoryObj.line;
                                }

                                if (tmpData[i].name === 'arrow') {
                                    this.options.currentDrawTool = factoryObj.arrow;
                                }

                                if (tmpData[i].name === 'ellipse') {
                                    this.options.currentDrawTool = factoryObj.ellipse;
                                }

                                if (tmpData[i].name === 'text') {
                                    this.options.currentDrawTool = factoryObj.text;
                                }
                                //this.options.currentDrawTool.init(factoryObj.options.canvas,factoryObj.options.ctx);
                                this.options.currentDrawTool.drawing = true;

                                if (this.options.movedObject == i && this.options.isResize === true) {
                                    if (this.options.arrResize.startX === true) {
                                        this.options.currentDrawTool.options.startX = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0] + this.options.diffX;
                                    } else {
                                        this.options.currentDrawTool.options.startX = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0];
                                    }

                                    if (this.options.arrResize.startY === true) {
                                        this.options.currentDrawTool.options.startY = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0] + this.options.diffY;
                                    } else {
                                        this.options.currentDrawTool.options.startY = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0];
                                    }

                                    if (this.options.arrResize.endX === true) {
                                        this.options.currentDrawTool.options.endX = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0] + this.options.diffX;
                                    } else {
                                        this.options.currentDrawTool.options.endX = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0];
                                    }

                                    if (this.options.arrResize.endY === true) {
                                        this.options.currentDrawTool.options.endY = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0] + this.options.diffY;
                                    } else {
                                        this.options.currentDrawTool.options.endY = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0];
                                    }
                                } else if (this.options.movedObject == i && this.options.isClicked === false) {
                                    this.options.currentDrawTool.options.startX = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startX[0] + this.options.diffX;
                                    this.options.currentDrawTool.options.startY = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].startY[0] + this.options.diffY;
                                    this.options.currentDrawTool.options.endX = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endX[0] + this.options.diffX;
                                    this.options.currentDrawTool.options.endY = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage][this.options.movedObject].endY[0] + this.options.diffY;
                                } else {
                                    this.options.currentDrawTool.options.startX = tmpData[i].startX[0];
                                    this.options.currentDrawTool.options.startY = tmpData[i].startY[0];
                                    this.options.currentDrawTool.options.endX = tmpData[i].endX[0];
                                    this.options.currentDrawTool.options.endY = tmpData[i].endY[0];
                                }

                                if (tmpData[i].name === 'text') {
                                    
                                    var tmpDiffX = 0;
                                    var tmpDiffY = 0;
                                    if (this.options.movedObject === i) {
                                        tmpDiffX = this.options.diffX;
                                        tmpDiffY = this.options.diffY;
                                    }

                                    this.options.currentDrawTool.canvas = this.canvas;
                                    this.options.currentDrawTool.ctx = this.ctx;

                                    this.options.currentDrawTool.redrawTool(tmpData[i].finalTextInfo, tmpDiffX, tmpDiffY);
                                } else {
                                    this.options.currentDrawTool.drawTool();
                                }
                                this.options.currentDrawTool.drawing = false;
                            } else {
                                if (tmpData[i].name === 'pencil') {
                                    this.options.currentDrawTool = factoryObj.pencil;
                                    this.options.currentDrawTool.options.pencilData = tmpData[i].pencilData;
                                    if (this.options.movedObject == i) {
                                        this.options.currentDrawTool.options.diffX = this.options.endX - this.options.startX;
                                        this.options.currentDrawTool.options.diffY = this.options.endY - this.options.startY;
                                    } else {
                                        this.options.currentDrawTool.options.diffX = 0;
                                        this.options.currentDrawTool.options.diffY = 0;
                                    }
                                }

                                if (this.options.currentDrawTool) {
                                    this.options.currentDrawTool.drawing = true;
                                    this.options.currentDrawTool.canvas = this.canvas;
                                    this.options.currentDrawTool.ctx = this.ctx;
                                    if (tmpData[i].name === 'pencil') {
                                        this.options.currentDrawTool.redrawTool();
                                    } else {
                                        this.options.currentDrawTool.drawTool();
                                    }
                                    this.options.currentDrawTool.drawing = false;
                                }
                            }
                            this.ctx.stroke();
                        }


                    }
                }
                var canvasData = this.canvas.toDataURL();

                if (!factoryObj.event.options.isSave) {
                    factoryObj.history.undo_list[factoryObj.history.options.activePage][0] = canvasData;
                } else {
                    factoryObj.history.final_canvas_url[factoryObj.history.options.activePage] = canvasData;
                }
                factoryObj.history.resetStyleElement();
            },
            resizeCheck: function(startX, startY, endX, endY) {
                if (this.options.startX >= startX && this.options.startX <= startX + this.options.resizeMargin && this.options.startY >= startY && this.options.startY <= startY + this.options.resizeMargin) {
                    this.options.arrResize.startX = true;
                    this.options.arrResize.startY = true;
                    this.options.arrResize.endX = false;
                    this.options.arrResize.endY = false;
                    this.options.cursorStyle = 'nwse-resize';
                    this.options.isResize = true;
                } else if (this.options.startX <= endX && this.options.startX >= endX - this.options.resizeMargin && this.options.startY <= endY && this.options.startY >= endY - this.options.resizeMargin) {
                    this.options.arrResize.startX = false;
                    this.options.arrResize.startY = false;
                    this.options.arrResize.endX = true;
                    this.options.arrResize.endY = true;
                    this.options.cursorStyle = 'nwse-resize';
                    this.options.isResize = true;
                } else if (this.options.startX >= startX && this.options.startX <= startX + this.options.resizeMargin && this.options.startY <= endY && this.options.startY >= endY - this.options.resizeMargin) {
                    this.options.arrResize.startX = true;
                    this.options.arrResize.startY = false;
                    this.options.arrResize.endX = false;
                    this.options.arrResize.endY = true;
                    this.options.cursorStyle = 'nesw-resize';
                    this.options.isResize = true;
                } else if (this.options.startX <= endX && this.options.startX >= endX - this.options.resizeMargin && this.options.startY >= startY && this.options.startY <= startY + this.options.resizeMargin) {
                    this.options.arrResize.startX = false;
                    this.options.arrResize.startY = true;
                    this.options.arrResize.endX = true;
                    this.options.arrResize.endY = false;
                    this.options.cursorStyle = 'nesw-resize';
                    this.options.isResize = true;
                } else if (this.options.startX >= startX && this.options.startX <= startX + this.options.resizeMargin) {
                    this.options.arrResize.startX = true;
                    this.options.arrResize.startY = false;
                    this.options.arrResize.endX = false;
                    this.options.arrResize.endY = false;
                    this.options.cursorStyle = 'ew-resize';
                    this.options.isResize = true;
                } else if (this.options.startX <= endX && this.options.startX >= endX - this.options.resizeMargin) {
                    this.options.arrResize.startX = false;
                    this.options.arrResize.startY = false;
                    this.options.arrResize.endX = true;
                    this.options.arrResize.endY = false;
                    this.options.cursorStyle = 'ew-resize';
                    this.options.isResize = true;
                } else if (this.options.startY >= startY && this.options.startY <= startY + this.options.resizeMargin) {
                    this.options.arrResize.startX = false;
                    this.options.arrResize.startY = true;
                    this.options.arrResize.endX = false;
                    this.options.arrResize.endY = false;
                    this.options.cursorStyle = 'ns-resize';
                    this.options.isResize = true;
                } else if (this.options.startY <= endY && this.options.startY >= endY - this.options.resizeMargin) {
                    this.options.arrResize.startX = false;
                    this.options.arrResize.startY = false;
                    this.options.arrResize.endX = false;
                    this.options.arrResize.endY = true;
                    this.options.cursorStyle = 'ns-resize';
                    this.options.isResize = true;
                }
            },
            hitTest: function() {
                var tmpData = factoryObj.history.raw_undo_list[factoryObj.history.options.activePage];
                var cntStart = tmpData.length - 1;
                this.options.movedObject = -1;
                this.options.selectedTool = '';

                for (i = cntStart; i >= 0; i--) {
                    if (this.options.movedObject > -1) {
                        break;
                    }
                    if(tmpData[i] === undefined || tmpData[i] === null) {
                        continue;
                    }
                    factoryObj.history.options.arrData = tmpData[i];

                    if (factoryObj.history.options.arrData.name === 'square') {
                        if (this.options.startX >= factoryObj.history.options.arrData.startX[0] && this.options.startX <= factoryObj.history.options.arrData.endX[0] && this.options.startY >= factoryObj.history.options.arrData.startY[0] && this.options.startY <= factoryObj.history.options.arrData.endY[0]) {
                            this.options.movedObject = i;
                            break;
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'image') {
                        if (this.options.startX >= factoryObj.history.options.arrData.startX[0] && this.options.startX <= factoryObj.history.options.arrData.endX[0] && this.options.startY >= factoryObj.history.options.arrData.startY[0] && this.options.startY <= factoryObj.history.options.arrData.endY[0]) {
                            this.options.movedObject = i;
                            this.resizeCheck(factoryObj.history.options.arrData.startX[0], factoryObj.history.options.arrData.startY[0], factoryObj.history.options.arrData.endX[0], factoryObj.history.options.arrData.endY[0]);
                            break;
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'text') {
                        if (this.options.startX >= factoryObj.history.options.arrData.startX[0] && this.options.startX <= factoryObj.history.options.arrData.endX[0] && this.options.startY >= factoryObj.history.options.arrData.startY[0] && this.options.startY <= factoryObj.history.options.arrData.endY[0]) {
                            this.options.movedObject = i;
                            this.options.selectedTool = 'text';
                            break;
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'pencil') {
                        if (factoryObj.history.options.arrData.pencilData.length > 0) {
                            for (j = 0; j < factoryObj.history.options.arrData.pencilData.length; j++) {
                                if (parseInt(factoryObj.history.options.arrData.pencilData[j].x - 4) <= this.options.startX && parseInt(factoryObj.history.options.arrData.pencilData[j].x + 4) >= this.options.startX && parseInt(factoryObj.history.options.arrData.pencilData[j].y - 4) <= this.options.startY && parseInt(factoryObj.history.options.arrData.pencilData[j].y + 4) >= this.options.startY) {
                                    this.options.movedObject = i;
                                    break;
                                }
                            }
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'circle') {
                        var r = tmpData[i].radius;

                        var x = tmpData[i].startX[0] - this.options.startX;
                        var y = tmpData[i].startY[0] - this.options.startY;

                        if (parseInt(x * x + y * y) < parseInt(r * r)) {
                            this.options.movedObject = i;
                            break;
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'ellipse') {
                        var max = 0;
                        var min = 100000000;
                        var tmpXPos = 0;
                        this.options.startX = Math.floor(this.options.startX);
                        for (var j = 0 * Math.PI; j < 2 * Math.PI; j += 0.01) {
                            xPos = Math.floor(factoryObj.history.options.arrData.startX[0] - parseInt(factoryObj.history.options.arrData.endX[0] - factoryObj.history.options.arrData.startX[0]) * Math.cos(j));
                            yPos = Math.floor(factoryObj.history.options.arrData.startY[0] + parseInt(factoryObj.history.options.arrData.endY[0] - factoryObj.history.options.arrData.startY[0]) * Math.sin(j));

                            if (this.options.startX >= xPos - 5 && this.options.startX <= xPos + 5) {

                                if (this.options.startX == xPos) {
                                    tmpXPos = xPos;
                                }
                                if (min > yPos) {
                                    min = yPos;
                                }

                                if (max < yPos) {
                                    max = yPos;
                                }
                            }
                        }

                        if (this.options.startX == tmpXPos && this.options.startY > min && this.options.startY < max) {
                            this.options.movedObject = i;
                            break;
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'line') {
                        if (factoryObj.history.options.arrData.endX[0] < factoryObj.history.options.arrData.startX[0]) {
                            var minX = factoryObj.history.options.arrData.endX[0];
                            var maxX = factoryObj.history.options.arrData.startX[0];
                        } else {
                            var minX = factoryObj.history.options.arrData.startX[0];
                            var maxX = factoryObj.history.options.arrData.endX[0];
                        }

                        if (factoryObj.history.options.arrData.endY[0] < factoryObj.history.options.arrData.startY[0]) {
                            var minY = factoryObj.history.options.arrData.endY[0];
                            var maxY = factoryObj.history.options.arrData.startY[0];
                        } else {
                            var minY = factoryObj.history.options.arrData.startY[0];
                            var maxY = factoryObj.history.options.arrData.endY[0];
                        }

                        if (this.options.startX >= minX && this.options.startX <= maxX && this.options.startY >= minY && this.options.startY <= maxY) {
                            var newangle = Math.atan2(this.options.startY - factoryObj.history.options.arrData.startY[0], this.options.startX - factoryObj.history.options.arrData.startX[0]);

                            var angleDiff = Math.abs(newangle) - Math.abs(factoryObj.history.options.arrData.lineAngle);
                            if (Math.abs(angleDiff) < 0.2) {
                                this.options.movedObject = i;
                                break;
                            }
                        }
                    }

                    if (factoryObj.history.options.arrData.name === 'arrow') {
                        if (factoryObj.history.options.arrData.endX[0] < factoryObj.history.options.arrData.startX[0]) {
                            var minX = factoryObj.history.options.arrData.endX[0];
                            var maxX = factoryObj.history.options.arrData.startX[0];
                        } else {
                            var minX = factoryObj.history.options.arrData.startX[0];
                            var maxX = factoryObj.history.options.arrData.endX[0];
                        }

                        if (factoryObj.history.options.arrData.endY[0] < factoryObj.history.options.arrData.startY[0]) {
                            var minY = factoryObj.history.options.arrData.endY[0];
                            var maxY = factoryObj.history.options.arrData.startY[0];
                        } else {
                            var minY = factoryObj.history.options.arrData.startY[0];
                            var maxY = factoryObj.history.options.arrData.endY[0];
                        }

                        if (this.options.startX >= minX && this.options.startX <= maxX && this.options.startY >= minY && this.options.startY <= maxY) {
                            var newangle = Math.atan2(this.options.startY - factoryObj.history.options.arrData.startY[0], this.options.startX - factoryObj.history.options.arrData.startX[0]);

                            var angleDiff = Math.abs(newangle) - Math.abs(factoryObj.history.options.arrData.arrowAngle);

                            if (Math.abs(angleDiff) < 0.2) {
                                this.options.movedObject = i;
                                break;
                            }
                        }
                    }
                }
            }
        };

        factoryObj.square = {
            name: 'square',
            options: {
                stroke_color: ['00', '00', '00'],
                dim: 4
            },
            init: function(canvas, ctx) {
                this.canvas = canvas;
                this.ctx = ctx;
                this.drawing = false;
            },
            start: function(evt) {
                this.canvas_coords = this.canvas.getBoundingClientRect();
                var x = evt.pageX - this.canvas_coords.left;
                var y = evt.pageY - this.canvas_coords.top;
                this.options.startX = x;
                this.options.startY = y;

                this.options.endX = x;
                this.options.endY = y;

                this.ctx.beginPath();
                this.drawing = true;
            },
            stroke: function(evt) {
                if (this.drawing) {
                    factoryObj.history.drawingState(this.canvas, this.ctx, factoryObj.history.undo_list);
                    this.ctx.beginPath();

                    var x = evt.pageX - this.canvas_coords.left;
                    var y = evt.pageY - this.canvas_coords.top;

                    this.options.endX = x;
                    this.options.endY = y;

                    this.drawTool();
                }
            },
            stop: function(evt) {
                if (this.drawing && this.options.startX !== this.options.endX && this.options.startY !== this.options.endY) {
                    this.ctx.beginPath();

                    this.options.width = this.options.endX - this.options.startX;
                    this.options.height = this.options.endY - this.options.startY;
                    this.drawTool();
                    this.ctx.stroke();

                    this.drawing = false;
                    factoryObj.history.setRawData();
                    factoryObj.history.saveState(this.canvas);
                } else {
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.drawing = false;
                }
            },
            drawLine: function(startPt, endPt) {
                factoryObj.history.setStyleElement(this.canvas, this.ctx);

                this.ctx.moveTo(startPt.x, startPt.y);
                this.ctx.lineTo(endPt.x, endPt.y);
                this.ctx.stroke();
            },
            drawTool: function() {
                lineP1 = { x: this.options.startX, y: this.options.startY, r: 0 };
                lineP2 = { x: this.options.startX, y: this.options.endY, r: 0 };
                lineP3 = { x: this.options.endX, y: this.options.endY, r: 0 };
                lineP4 = { x: this.options.endX, y: this.options.startY, r: 0 };
                this.drawLine(lineP1, lineP2);
                this.drawLine(lineP2, lineP3);
                this.drawLine(lineP3, lineP4);
                this.drawLine(lineP4, lineP1);
            }
        };

        factoryObj.renderPage = function (page) {
            var viewport = page.getViewport(factoryObj.options.pdfOptions.scale);
            var canvas_rand = document.createElement('canvas');

            var ctx_rand = canvas_rand.getContext('2d');
            var renderContext = {
                canvasContext: ctx_rand,
                viewport: viewport
            };

            canvas_rand.setAttribute('id', 'page' + page.pageIndex);
            canvas_rand.height = viewport.height;
            canvas_rand.width = viewport.width;

            factoryObj.history.options.canvas_width = canvas_rand.width;
            factoryObj.history.options.canvas_height = canvas_rand.height;
            factoryObj.options.toolsObj.canvasContainer.appendChild(canvas_rand);

            var task = page.render(renderContext);
            $( document ).ready(function() {
                task.promise.then(function () {
                    factoryObj.options.bindCnt++;
                    if (factoryObj.options.bindFlag === '' && page.transport.numPages == factoryObj.options.bindCnt) {
                        factoryObj.history.options.pdfobj = page;
                        factoryObj.bindEvent(0);
                        factoryObj.options.bindFlag = 1;
                    }
                });
            });
        };

        factoryObj.renderImage = function(url) {
            var canvas_rand = document.createElement('canvas');
            var ctx_rand = canvas_rand.getContext('2d');
            canvas_rand.setAttribute('id', 'page0');
            var img = new Image();
            img.setAttribute('crossOrigin', 'anonymous');
            img.onload = function () {
                canvas_rand.height = img.height;
                canvas_rand.width = img.width;
                ctx_rand.drawImage(img, 0, 0, img.width, img.height);
                factoryObj.history.options.canvas_width = img.width;
                factoryObj.history.options.canvas_height = img.height;
                factoryObj.options.toolsObj.canvasContainer.appendChild(canvas_rand);
                factoryObj.bindEvent(0);
            }
            img.src = url;
            factoryObj.options.url = url;
        },

        factoryObj.bindEvent = function (page) {
            if (factoryObj.options.bindFlag == '') {
                factoryObj.options.bindFlag = 'true';
                factoryObj.history.options.PrevPage = page;
                factoryObj.history.options.activePage = page;
                factoryObj.options.canvas = factoryObj.options.toolsObj.canvas;
                factoryObj.options.ctx = factoryObj.options.canvas.getContext('2d');

                if (!factoryObj.history.initial_canvas_url.hasOwnProperty(page)) {
                    var tmpImgObj = document.getElementById('page' + page);
                    factoryObj.history.initial_canvas_url[page] = tmpImgObj.toDataURL();
                    factoryObj.history.undo_list[page] = [tmpImgObj.toDataURL()];
                    factoryObj.history.final_canvas_url[factoryObj.history.options.activePage] = factoryObj.history.initial_canvas_url[factoryObj.history.options.activePage];
                    factoryObj.options.imgURL = factoryObj.history.initial_canvas_url[factoryObj.history.options.activePage];
                } else {
                    factoryObj.options.imgURL = factoryObj.history.final_canvas_url[factoryObj.history.options.activePage];
                }

                factoryObj.options.canvas.height = factoryObj.history.options.canvas_height;
                factoryObj.options.canvas.width = factoryObj.history.options.canvas_width;

                var img = document.createElement("img");
                img.src = factoryObj.options.imgURL;
                img.onload = function () {
                    factoryObj.options.canvas_coords = factoryObj.options.canvas.getBoundingClientRect();
                    factoryObj.history.options.canvas_coords = factoryObj.options.canvas_coords;
                    factoryObj.options.ctx.clearRect(0, 0, factoryObj.options.canvas.width, factoryObj.options.canvas.height);
                    factoryObj.options.ctx.drawImage(img, 0, 0, factoryObj.options.canvas.width, factoryObj.options.canvas.height);

                    factoryObj.options.toolsObj.loading.textContent = '';

                    factoryObj.history.saveState(factoryObj.options.canvas);

                    if (factoryObj.options.btnFlag === false) {
                        factoryObj.options.btnFlag = true;
                        factoryObj.options.toolsObj.pencil.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.pencil;
                            factoryObj.history.manageActiveBtn('pencil');
                            factoryObj.pencil.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.square.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.square;
                            factoryObj.history.manageActiveBtn('square');
                            factoryObj.square.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.circle.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.circle;
                            factoryObj.history.manageActiveBtn('circle');
                            factoryObj.circle.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.ellipse.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.ellipse;
                            factoryObj.history.manageActiveBtn('ellipse');
                            factoryObj.ellipse.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.text.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.text;
                            factoryObj.history.manageActiveBtn('text');
                            factoryObj.text.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.contenteditor.addEventListener('blur', function (evt) {
                            evt.stopPropagation();
                            factoryObj.options.toolsObj.editor_wrapper.style.display = 'none';
                            factoryObj.text.drawTool();
                        });

                        factoryObj.options.toolsObj.arrow.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.arrow;
                            factoryObj.history.manageActiveBtn('arrow');
                            factoryObj.arrow.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.line.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = factoryObj.line;
                            factoryObj.history.manageActiveBtn('line');
                            factoryObj.line.init(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.imageupload.addEventListener('change', function () {
                            if(this.files[0] && this.files[0].size < 2*1024*1024 ){
                                factoryObj.image.uploadImage(this.files[0]);
                                factoryObj.event.options.activeTool = factoryObj.image;
                                factoryObj.history.manageActiveBtn('clear_image');
                                factoryObj.image.init(factoryObj.options.canvas, factoryObj.options.ctx);
                                $("#imagesize").addClass('hide');
                            }
                            else{
                                $("#imagesize").removeClass('hide');
                            }

                        });

                        factoryObj.options.toolsObj.clear_image.addEventListener('click', function () {
                            factoryObj.image.resetImage();
                            factoryObj.options.toolsObj.frm_canvas_tool.reset();
                        });

                        factoryObj.options.toolsObj.undo.addEventListener('click', function () {
                            factoryObj.history.undo(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.redo.addEventListener('click', function () {
                            factoryObj.history.redo(factoryObj.options.canvas, factoryObj.options.ctx);
                        });

                        factoryObj.options.toolsObj.save.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = '';
                            factoryObj.history.manageActiveBtn('');
                            factoryObj.event.savepdf('saveandclose');
                        });

                        factoryObj.options.toolsObj.apply.addEventListener('click', function () {
                            factoryObj.event.options.activeTool = '';
                            factoryObj.history.manageActiveBtn('');
                            factoryObj.event.savepdf('apply');
                        });

                        factoryObj.options.toolsObj.fontsize.addEventListener('change', function () {
                            factoryObj.history.options.font_size = this.value;
                        });

                        factoryObj.options.toolsObj.fillstyle.addEventListener('change', function () {
                            factoryObj.history.options.fillStyle = '#' + this.value;
                        });

                        factoryObj.options.toolsObj.linewidth.addEventListener('change', function () {
                            factoryObj.history.options.lineWidth = this.value;
                        });

                        factoryObj.options.toolsObj.prevBtn.addEventListener('click', function () {
                            if (!factoryObj.options.toolsObj.prevBtn.getAttribute('disable')) {
                                factoryObj.options.bindFlag = '';
                                factoryObj.bindEvent(parseInt(factoryObj.history.options.activePage - 1));
                            }
                        });

                        factoryObj.options.toolsObj.nextBtn.addEventListener('click', function () {
                            if (!factoryObj.options.toolsObj.nextBtn.getAttribute('disabled')) {
                                factoryObj.options.bindFlag = '';
                                factoryObj.bindEvent(parseInt(factoryObj.history.options.activePage + 1));
                            }
                        });

                        document.addEventListener('keydown', function(e) {
                            if(factoryObj.options.toolsObj.canvas) {
                                if(e.keyCode == 8 || e.keyCode == 46) {
                                    factoryObj.event.removeObject();
                                }
                                
                                if(e.keyCode == 13) {
                                    if(factoryObj.move.options.selectedTool == 'text' && factoryObj.move.options.selectedObject >= 0) {
                                      factoryObj.text.editText();    
                                    }
                                    
                                }
                            }
                        }, false);

                        factoryObj.options.toolsObj.fontsize.value = factoryObj.history.options.font_size;
                        factoryObj.options.toolsObj.fillstyle.value = factoryObj.history.options.fillStyle;
                        factoryObj.options.toolsObj.linewidth.value = factoryObj.history.options.lineWidth;
                    }

                    factoryObj.event.init(factoryObj.options.canvas, factoryObj.options.ctx);
                    factoryObj.history.setButtonStyle();
                    if(factoryObj.options.actionListObj.length > 0) {
                        factoryObj.move.init(factoryObj.options.canvas,factoryObj.options.ctx);
                        factoryObj.move.redrawTool();
                    }
                };
            }
        };

        factoryObj.renderPages = function (pdfDoc) {
            factoryObj.history.options.numPages = pdfDoc.numPages;
            for (var num = 1; num <= pdfDoc.numPages; num++) {
                pdfDoc.getPage(num).then(factoryObj.renderPage);
            }
        };

        factoryObj.renderPDF = function (url, fileType, canvasContainer, options) {
            this.options.pdfOptions = options || { scale: 2 };
            factoryObj.options.toolsObj.loading.textContent = 'Wait while loading PDF file...';
            factoryObj.history.raw_undo_list = angular.copy(factoryObj.options.actionListObj);

            PDFJS.disableWorker = false;
            PDFJS.workerSrc = factoryObj.options.pdfWorker;
            (fileType === 'pdf') ? PDFJS.getDocument(url).then(factoryObj.renderPages) : factoryObj.renderImage(url);
        };

        return factoryObj;
    });

    module.directive('pdfAnnotation', ['pdfAnnotationFactory', function (pdfAnnotationFactory) {
        return {
            restrict: 'E',
            scope: {
                options: '=',
                callbackFn: '&',
                closeFn: '&',
                saveAttachment: '&'
            },
            transclude: true,
            template: '<div id="controllers"><span class="controller btn btn-icn" id="pencil" title="Freehand Drawing"></span><span class="controller btn btn-icn" id="square" title="Square"></span><span class="controller btn btn-icn hide" id="circle" title="Circle"></span><span class="controller btn btn-icn" id="ellipse" title="Ellipse"></span><span class="controller btn btn-icn" id="text" title="Text"></span><span class="controller btn btn-icn" id="arrow" title="Arrow"></span><span class="controller btn btn-icn" id="line" title="Line"></span><span class="controller btn btn-icn" id="undo" title="Undo"></span><span class="controller btn btn-icn" id="redo" title="Redo"></span><span class="controller title" id="activePage" disabled="disabled"></span>&nbsp; out of&nbsp;<span class="controller title" id="totalPage" disabled="disabled"></span><span class="controller btn" id="prevBtn"><</span> &nbsp;<input type="text" class="pagenumber" name="currentPage" id="currentPage" />&nbsp;<span class="controller btn" id="nextBtn">></span><span id="imagesize" class="hide">Please upload image below 2MB size.</span><a href="#" id="close" title="Cancel" class="controller btn  btnRight">&nbsp;Cancel</a><span class="controller btn  btnRight" id="savecsf" title="Save & Close">Save & Close</span><span class="controller btn  btnRight" id="applycsf" title="Apply">Apply</span><br /><br /><form id="frm_canvas_tool"><input name="imageupload" id="imageupload" class="input_file" type="file" accept="image/*" ><span class="controller btn hide" id="clear_image">Clear Image</span></form>    Font Size:<select id="fontsize" name="fontsize"><option value="">Select Font Size</option><option value="2">2px</option><option value="5">5px</option><option value="7">7px</option><option value="8">8px</option><option value="9">9px</option><option value="10">10px</option><option value="11">11px</option><option value="12">12px</option><option value="13">13px</option><option value="14">14px</option><option value="16">16px</option><option value="18">18px</option><option value="32">32px</option></select>    Color:<select id="fillstyle" name="fillstyle"><option>Select Color</option><option value="FF0000">Red</option><option value="00FF00">Green</option><option value="0000FF">Blue</option><option value="000000">Black</option><option value="FFFFFF">White</option></select>    Line Width:<select id="linewidth" name="linewidth"><option value="">Select Line Width</option><option value="2">2px</option><option value="5">5px</option><option value="7">7px</option><option value="8">8px</option></select><span class="controller" id="loading"></span></div><div id="canvas-container" class="canvas-container" style="visibility: hidden; height: 0px;"></div><div id="canvas-cont" class="canvas-container"><canvas id="canvas"></canvas><div id="editor_wrapper" style="display:none;"><textarea id="contenteditor"  onkeyup="textAreaAdjust(this)" style="overflow:hidden"></textarea></div></div><div ng-if="errorURL"><h1>URL not found!</h1></div>',
            link: function link(scope, element, attrs, ctrl) {
                pdfAnnotationFactory.options.closeFn = scope.closeFn;
                pdfAnnotationFactory.options.callbackFn = scope.callbackFn;
                pdfAnnotationFactory.options.toolsObj.loading = angular.element(document.querySelector('#loading'))[0];
                pdfAnnotationFactory.options.toolsObj.pencil = angular.element(document.querySelector('#pencil'))[0];
                pdfAnnotationFactory.options.toolsObj.square = angular.element(document.querySelector('#square'))[0];
                pdfAnnotationFactory.options.toolsObj.circle = angular.element(document.querySelector('#circle'))[0];
                pdfAnnotationFactory.options.toolsObj.ellipse = angular.element(document.querySelector('#ellipse'))[0];
                pdfAnnotationFactory.options.toolsObj.text = angular.element(document.querySelector('#text'))[0];
                pdfAnnotationFactory.options.toolsObj.contenteditor = angular.element(document.querySelector('#contenteditor'))[0];
                pdfAnnotationFactory.options.toolsObj.editor_wrapper = angular.element(document.querySelector('#editor_wrapper'))[0];
                pdfAnnotationFactory.options.toolsObj.arrow = angular.element(document.querySelector('#arrow'))[0];
                pdfAnnotationFactory.options.toolsObj.line = angular.element(document.querySelector('#line'))[0];
                pdfAnnotationFactory.options.toolsObj.imageupload = angular.element(document.querySelector('#imageupload'))[0];
                pdfAnnotationFactory.options.toolsObj.clear_image = angular.element(document.querySelector('#clear_image'))[0];
                pdfAnnotationFactory.options.toolsObj.frm_canvas_tool = angular.element(document.querySelector('#frm_canvas_tool'))[0];
                pdfAnnotationFactory.options.toolsObj.undo = angular.element(document.querySelector('#undo'))[0];
                pdfAnnotationFactory.options.toolsObj.redo = angular.element(document.querySelector('#redo'))[0];
                pdfAnnotationFactory.options.toolsObj.save = angular.element(document.querySelector('#savecsf'))[0];
                pdfAnnotationFactory.options.toolsObj.fontsize = angular.element(document.querySelector('#fontsize'))[0];
                pdfAnnotationFactory.options.toolsObj.fillstyle = angular.element(document.querySelector('#fillstyle'))[0];
                pdfAnnotationFactory.options.toolsObj.linewidth = angular.element(document.querySelector('#linewidth'))[0];
                pdfAnnotationFactory.options.toolsObj.prevBtn = angular.element(document.querySelector('#prevBtn'))[0];
                pdfAnnotationFactory.options.toolsObj.nextBtn = angular.element(document.querySelector('#nextBtn'))[0];
                pdfAnnotationFactory.options.toolsObj.activePage = angular.element(document.querySelector('#activePage'))[0];
                pdfAnnotationFactory.options.toolsObj.currentPage = angular.element(document.querySelector('#currentPage'))[0];
                pdfAnnotationFactory.options.toolsObj.totalPage = angular.element(document.querySelector('#totalPage'))[0];
                pdfAnnotationFactory.options.toolsObj.canvas = angular.element(document.querySelector('#canvas'))[0];
                pdfAnnotationFactory.options.toolsObj.close = angular.element(document.querySelector('#close'))[0];
                pdfAnnotationFactory.options.toolsObj.apply = angular.element(document.querySelector('#applycsf'))[0];
                pdfAnnotationFactory.options.saveAttachment = scope.saveAttachment;

                pdfAnnotationFactory.options.toolsObj.canvasContainer = angular.element(document.querySelector('#canvas-container'))[0];

                pdfAnnotationFactory.options.toolsObj.close.addEventListener('click', function () {
                    pdfAnnotationFactory.event.options.activeTool = '';
                    pdfAnnotationFactory.history.manageActiveBtn('');
                    pdfAnnotationFactory.event.closepdf();
                });

                scope.$watch('options', function (newValue, oldValue) {
                    if (scope.options.url !== '') {
                        pdfAnnotationFactory.options.actionListObj = [];
                        pdfAnnotationFactory.history.initial_canvas_url = [];
                        pdfAnnotationFactory.history.final_canvas_url = [];
                        pdfAnnotationFactory.history.final_canvas_url = [];
                        pdfAnnotationFactory.history.redo_list = [];
                        pdfAnnotationFactory.history.undo_list = [];
                        pdfAnnotationFactory.history.raw_undo_list = [];
                        pdfAnnotationFactory.history.raw_redo_list = [];
                        pdfAnnotationFactory.history.raw_undo_ver_list = [];
                        pdfAnnotationFactory.history.raw_redo_ver_list = [];
                        pdfAnnotationFactory.history.deletedAttachmentArr = [];
                        pdfAnnotationFactory.history.tmp_raw_undo_list = '';
                        pdfAnnotationFactory.history.options.activePage = 0;
                        pdfAnnotationFactory.history.manageActiveBtn('');
                        pdfAnnotationFactory.history.setButtonStyle();

                        pdfAnnotationFactory.options.toolsObj.canvasContainer.innerHTML = '';
                        pdfAnnotationFactory.text.options.finalTextInfo = [];
                        pdfAnnotationFactory.options.bindFlag = '';
                        pdfAnnotationFactory.options.btnFlag = false;
                        pdfAnnotationFactory.options.bindCnt = 0;
                        pdfAnnotationFactory.move.options.isSelectedObj = false;
                        pdfAnnotationFactory.move.options.selectedObject = -1;

                        if (scope.options.pdfworker) {
                            pdfAnnotationFactory.options.pdfWorker = scope.options.pdfworker;
                        }

                        if (scope.options.actionListObj) {
                            pdfAnnotationFactory.options.actionListObj = scope.options.actionListObj;
                        }
                        scope.errorURL = false;
                        pdfAnnotationFactory.options.fileType = scope.options.fileType; 
                        pdfAnnotationFactory.renderPDF(scope.options.url, scope.options.fileType, pdfAnnotationFactory.options.toolsObj.canvasContainer);    
                        
                        
                    } else {
                        scope.errorURL = true;
                    }
                });
            }
        };
    }]);
});
$(window).scroll(function () {
    var a = 90;
    var pos = $(window).scrollTop();
    if (pos > a) {
        $("#controllers").css({
            position: 'relative'
        });
    } else {
        $("#controllers").css({
            position: 'relative'
        });
    }
});

function textAreaAdjust(o) {
    o.style.height = "1px";
    o.style.height = 25 + o.scrollHeight + "px";
}