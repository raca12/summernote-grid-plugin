/**
 * Summernote Grid Plugin v2.1
 *
 * Kolonlari contenteditable izolasyonu ile korur.
 * Row: contenteditable=false (Summernote dokunmaz)
 * Col: contenteditable=true (bagimsiz editleme alani)
 */
(function($) {
    'use strict';

    var gridLayouts = [
        { label: '2 Kolon',     cols: [6, 6] },
        { label: '3 Kolon',     cols: [4, 4, 4] },
        { label: '4 Kolon',     cols: [3, 3, 3, 3] },
        { label: '6 Kolon',     cols: [2, 2, 2, 2, 2, 2] },
        { label: '12 Kolon',    cols: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
        { label: '8 + 4',       cols: [8, 4] },
        { label: '4 + 8',       cols: [4, 8] },
        { label: '9 + 3',       cols: [9, 3] },
        { label: '3 + 9',       cols: [3, 9] },
        { label: '3 + 6 + 3',   cols: [3, 6, 3] },
        { label: '2 + 8 + 2',   cols: [2, 8, 2] },
        { label: '4 + 4 + 4',   cols: [4, 4, 4] },
    ];

    var GridPlugin = function(context) {
        var ui = $.summernote.ui;
        var $editor = context.layoutInfo.editable;
        var self = this;

        // ---- Son aktif kolon (toolbar insert icin) ----
        this.lastActiveCol = null;
        this.lastRange = null;

        // ---- Toolbar button ----
        context.memo('button.grid', function() {
            return ui.buttonGroup([
                ui.button({
                    className: 'dropdown-toggle',
                    contents: '<i class="bi bi-grid-3x2-gap"></i> <span class="note-icon-caret"></span>',
                    tooltip: 'Grid Ekle',
                    data: { toggle: 'dropdown' }
                }),
                ui.dropdown({
                    className: 'dropdown-menu',
                    contents: self.buildDropdown(),
                    callback: function($dropdown) {
                        $dropdown.find('[data-grid-index]').on('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            self.insertGrid(gridLayouts[$(this).data('grid-index')]);
                        });
                    }
                })
            ]).render();
        });

        // ---- Dropdown HTML ----
        this.buildDropdown = function() {
            var html = '';
            $.each(gridLayouts, function(i, layout) {
                var preview = '<span style="display:inline-flex;gap:1px;margin-right:8px;vertical-align:middle;">';
                $.each(layout.cols, function(_, size) {
                    var w = Math.max(3, Math.round(size * 3.5));
                    preview += '<span style="display:inline-block;width:' + w + 'px;height:12px;background:#6c757d;border-radius:1px;"></span>';
                });
                preview += '</span>';
                html += '<li><a class="dropdown-item" href="#" data-grid-index="' + i + '">' + preview + layout.label + '</a></li>';
            });
            return html;
        };

        // ---- Grid ekleme ----
        this.insertGrid = function(layout) {
            var row = document.createElement('div');
            row.className = 'row sn-grid';
            row.setAttribute('contenteditable', 'false');

            for (var i = 0; i < layout.cols.length; i++) {
                var col = document.createElement('div');
                col.className = 'col-md-' + layout.cols[i] + ' sn-grid-col';
                col.setAttribute('contenteditable', 'true');
                col.innerHTML = '<p><br></p>';
                row.appendChild(col);
            }

            // Sonrasi icin bos paragraf
            var after = document.createElement('p');
            after.innerHTML = '<br>';

            context.invoke('editor.insertNode', row);
            $(row).after(after);

            // Koruma baslat
            self.protectRow($(row));

            // Ilk kolona focus ver
            self.focusCol(row.querySelector('.sn-grid-col'));
        };

        // ---- Kolona focus ve cursor yerlestir ----
        this.focusCol = function(col) {
            if (!col) return;
            col.focus();
            var range = document.createRange();
            var sel = window.getSelection();
            var target = col.querySelector('p') || col;
            range.selectNodeContents(target);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            self.lastActiveCol = col;
            self.lastRange = range.cloneRange();
        };

        // ---- Kolon koruma ----
        this.protectRow = function($row) {
            $row.find('.sn-grid-col').each(function() {
                var $col = $(this);

                // Paste: icerik kolonda kalsin, disari tasmasin
                $col.on('paste', function(e) {
                    e.stopPropagation();
                    e.preventDefault();

                    var clip = (e.originalEvent || e).clipboardData;
                    var html = clip.getData('text/html');
                    var text = clip.getData('text/plain');

                    if (html) {
                        var $temp = $('<div>').html(html);
                        $temp.find('script,style,meta,link').remove();
                        html = $temp.html();
                        document.execCommand('insertHTML', false, html);
                    } else if (text) {
                        var safe = $('<div>').text(text).html().replace(/\n/g, '<br>');
                        document.execCommand('insertHTML', false, safe);
                    }
                });

                // Keydown: Backspace/Delete ile kolon silinmesin
                $col.on('keydown', function(e) {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        var content = this.innerHTML.replace(/<br\s*\/?>/gi, '').replace(/<p>\s*<\/p>/gi, '').trim();
                        if (!content || content === '') {
                            e.preventDefault();
                            this.innerHTML = '<p><br></p>';
                        }
                    }

                    // Tab ile sonraki kolona gec
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        e.stopPropagation();
                        var cols = $col.siblings('.sn-grid-col').addBack();
                        var idx = cols.index($col);
                        var next = e.shiftKey ? cols.eq(idx - 1) : cols.eq(idx + 1);
                        if (next.length) {
                            self.focusCol(next[0]);
                        }
                    }
                });

                // Drop: drag-drop kolonda kalsin
                $col.on('drop', function(e) {
                    e.stopPropagation();
                });
            });
        };

        // ---- Kolon focus takibi (toolbar insert icin kritik) ----
        $editor.on('mousedown', '.sn-grid-col', function() {
            self.lastActiveCol = this;
        });

        $editor.on('focusin', '.sn-grid-col', function() {
            self.lastActiveCol = this;
        });

        // Kolon icinde her selection degisikliginde range'i kaydet
        document.addEventListener('selectionchange', function() {
            var sel = window.getSelection();
            if (sel.rangeCount > 0) {
                var range = sel.getRangeAt(0);
                var container = range.startContainer;
                var $col = $(container).closest('.sn-grid-col');
                if ($col.length && $.contains($editor[0], $col[0])) {
                    self.lastActiveCol = $col[0];
                    self.lastRange = range.cloneRange();
                }
            }
        });

        // ---- Summernote insertNode override ----
        // Summernote video/image/link eklerken insertNode kullanir.
        // Eger son aktif kolon varsa, icerigi oraya yonlendir.
        var origInsertNode = null;

        this.initialize = function() {
            // insertNode'u yakala
            var editorModule = context.modules.editor;
            if (editorModule && editorModule.insertNode) {
                origInsertNode = editorModule.insertNode.bind(editorModule);
                editorModule.insertNode = function(node) {
                    // Grid kolonu aktifse, oraya ekle
                    if (self.lastActiveCol && $.contains($editor[0], self.lastActiveCol)) {
                        var col = self.lastActiveCol;

                        // Cursor'u kolona geri yerlestir
                        if (self.lastRange) {
                            var sel = window.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(self.lastRange);
                        }

                        // Kolon icindeyken normal insertNode calistir
                        try {
                            origInsertNode(node);
                        } catch(e) {
                            // Fallback: direkt kolona append et
                            col.appendChild(node);
                        }
                        return;
                    }
                    // Grid disinda normal davranis
                    origInsertNode(node);
                };
            }

            // Mevcut grid'leri koru
            $editor.find('.sn-grid').each(function() {
                $(this).attr('contenteditable', 'false');
                $(this).find('.sn-grid-col').attr('contenteditable', 'true');
                self.protectRow($(this));
            });

            // Eski format row'lari da koru
            $editor.find('.row:not(.sn-grid)').each(function() {
                var $row = $(this);
                if ($row.children('[class*="col-"]').length > 0) {
                    $row.addClass('sn-grid').attr('contenteditable', 'false');
                    $row.children('[class*="col-"]').addClass('sn-grid-col').attr('contenteditable', 'true');
                    self.protectRow($row);
                }
            });
        };

        // ---- HTML cikti temizleme (contenteditable attribute'larini kaldir) ----
        // Summernote 'code' cagrildiginda cikan HTML'i temizle
        context.memo('help.grid.clean', function() {
            return 'Grid cleanup on code retrieval';
        });

        // summernote('code') veya form submit icin event hook
        var origCodeFunc = null;
        var $note = context.$note || context.layoutInfo.note;

        // Summernote code getter'ini override et
        if ($note && $note.data('summernote')) {
            setTimeout(function() {
                var snApi = $note.data('summernote');
                if (snApi && snApi.code) {
                    var origCode = snApi.code;
                    snApi.code = function(html) {
                        // Setter: icerik yaziliyorsa direkt gec
                        if (typeof html === 'string') {
                            return origCode.call(snApi, html);
                        }
                        // Getter: HTML al ve temizle
                        var result = origCode.call(snApi);
                        return self.cleanHTML(result);
                    };
                }
            }, 100);
        }

        // ---- contenteditable temizleme fonksiyonu ----
        this.cleanHTML = function(html) {
            var $tmp = $('<div>').html(html);
            $tmp.find('.sn-grid').removeAttr('contenteditable');
            $tmp.find('.sn-grid-col').removeAttr('contenteditable');
            $tmp.find('.sn-grid-delete').remove();
            return $tmp.html();
        };

        // ---- Silme butonu ----
        $editor.on('click', '.sn-grid', function(e) {
            if ($(e.target).hasClass('sn-grid')) {
                var $row = $(this);
                $editor.find('.sn-grid-delete').remove();

                var $del = $('<button type="button" class="sn-grid-delete" title="Grid\'i sil">&times;</button>');
                $row.css('position', 'relative').prepend($del);
                $del.on('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $row.remove();
                });
            }
        });

        $editor.on('click', function(e) {
            if (!$(e.target).closest('.sn-grid').length) {
                $editor.find('.sn-grid-delete').remove();
            }
        });
    };

    $.extend(true, $.summernote, {
        plugins: {
            gridPlugin: GridPlugin
        }
    });

})(jQuery);
