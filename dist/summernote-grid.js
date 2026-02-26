/**
 * Summernote Grid Plugin v2
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
            var firstCol = row.querySelector('.sn-grid-col');
            if (firstCol) {
                firstCol.focus();
                // Cursor'u icine yerlestir
                var range = document.createRange();
                var sel = window.getSelection();
                range.selectNodeContents(firstCol.querySelector('p') || firstCol);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
            }
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

                    // HTML varsa temizle (script/style cikar)
                    if (html) {
                        var $temp = $('<div>').html(html);
                        $temp.find('script,style,meta,link').remove();
                        html = $temp.html();
                        document.execCommand('insertHTML', false, html);
                    } else if (text) {
                        // Plain text - satir sonlarini <br> yap
                        var safe = $('<div>').text(text).html().replace(/\n/g, '<br>');
                        document.execCommand('insertHTML', false, safe);
                    }
                });

                // Keydown: Backspace/Delete ile kolon silinmesin
                $col.on('keydown', function(e) {
                    // Backspace basinda veya Delete sonunda kolonu silmesin
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        var content = this.innerHTML.replace(/<br\s*\/?>/gi, '').replace(/<p>\s*<\/p>/gi, '').trim();
                        if (!content || content === '') {
                            // Kolon bos, silmeye izin verme
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
                            next.focus();
                        }
                    }
                });

                // Drop: drag-drop kolonda kalsin
                $col.on('drop', function(e) {
                    e.stopPropagation();
                });
            });
        };

        // ---- Toolbar komutlarini kolon icinde calistir ----
        // Summernote toolbar butonu tiklandiginda focus kolon disina kayabilir.
        // Bunu yakalayip tekrar kolona yonlendir.
        this.activeCol = null;

        $editor.on('focusin', '.sn-grid-col', function() {
            self.activeCol = this;
        });

        $editor.on('focusout', '.sn-grid-col', function() {
            // Kisa gecikme: toolbar tiklandiginda focus kaybiyla hemen null yapma
            var col = this;
            setTimeout(function() {
                if (self.activeCol === col && !$(document.activeElement).closest('.sn-grid-col').length) {
                    // Focus tamamen cikti
                }
            }, 200);
        });

        // ---- Mevcut grid'leri koru (sayfa yukleme, editor init) ----
        this.initialize = function() {
            $editor.find('.sn-grid').each(function() {
                $(this).attr('contenteditable', 'false');
                $(this).find('.sn-grid-col').attr('contenteditable', 'true');
                self.protectRow($(this));
            });

            // Eski format grid'leri de koru (row class'li ama sn-grid olmayan)
            $editor.find('.row:not(.sn-grid)').each(function() {
                var $row = $(this);
                if ($row.children('[class*="col-"]').length > 0) {
                    $row.addClass('sn-grid').attr('contenteditable', 'false');
                    $row.children('[class*="col-"]').addClass('sn-grid-col').attr('contenteditable', 'true');
                    self.protectRow($row);
                }
            });
        };

        // ---- Silme butonu ----
        $editor.on('click', '.sn-grid', function(e) {
            // Row'un kendisine tiklanirsa (kolon disina) silme butonu goster
            if ($(e.target).hasClass('sn-grid')) {
                var $row = $(this);
                // Mevcut silme butonunu kaldir
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

        // Baska yere tiklaninca silme butonunu kaldir
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
