/**
 * Summernote Grid Plugin v2.2
 *
 * Kolonlari contenteditable izolasyonu ile korur.
 * Row: contenteditable=false (Summernote dokunmaz)
 * Col: contenteditable=true (bagimsiz editleme alani)
 *
 * Media insert: MutationObserver ile editore eklenen media
 * node'larini yakalayip aktif kolona tasir.
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

        // ---- Son aktif kolon ve zamani ----
        this.lastActiveCol = null;
        this.lastActiveTime = 0;
        var COL_TIMEOUT = 30000; // 30 saniye icinde media eklenmezse kolon ref'i dusur

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

            var after = document.createElement('p');
            after.innerHTML = '<br>';

            context.invoke('editor.insertNode', row);
            $(row).after(after);

            self.protectRow($(row));
            self.focusCol(row.querySelector('.sn-grid-col'));
        };

        // ---- Kolona focus ----
        this.focusCol = function(col) {
            if (!col) return;
            col.focus();
            var range = document.createRange();
            var sel = window.getSelection();
            var target = col.querySelector('p') || col;
            range.selectNodeContents(target);
            range.collapse(false); // sona yerlestir
            sel.removeAllRanges();
            sel.addRange(range);
            self.setActiveCol(col);
        };

        // ---- Aktif kolon set ----
        this.setActiveCol = function(col) {
            self.lastActiveCol = col;
            self.lastActiveTime = Date.now();
        };

        // ---- Aktif kolon hala gecerli mi? ----
        this.isColActive = function() {
            return self.lastActiveCol &&
                   $.contains($editor[0], self.lastActiveCol) &&
                   (Date.now() - self.lastActiveTime) < COL_TIMEOUT;
        };

        // ---- Bir node media mi? ----
        this.isMediaNode = function(node) {
            if (node.nodeType !== 1) return false;
            var tag = node.tagName;
            if (tag === 'IFRAME' || tag === 'IMG' || tag === 'VIDEO' || tag === 'AUDIO') return true;
            if ($(node).hasClass('note-video-clip')) return true;
            if ($(node).find('iframe,img,video').length > 0) return true;
            return false;
        };

        // ---- Kolon koruma ----
        this.protectRow = function($row) {
            $row.find('.sn-grid-col').each(function() {
                var $col = $(this);

                // Focus takibi
                $col.on('mousedown focusin', function() {
                    self.setActiveCol(this);
                });

                // Paste korumasi
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

                // Backspace/Delete korumasi
                $col.on('keydown', function(e) {
                    if (e.key === 'Backspace' || e.key === 'Delete') {
                        var content = this.innerHTML.replace(/<br\s*\/?>/gi, '').replace(/<p>\s*<\/p>/gi, '').trim();
                        if (!content || content === '') {
                            e.preventDefault();
                            this.innerHTML = '<p><br></p>';
                        }
                    }

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

                // Drop korumasi
                $col.on('drop', function(e) {
                    e.stopPropagation();
                });
            });
        };

        // ---- MutationObserver: media node'larini kolona tasi ----
        this.observer = null;

        this.startObserver = function() {
            if (self.observer) return;

            self.observer = new MutationObserver(function(mutations) {
                if (!self.isColActive()) return;

                mutations.forEach(function(mutation) {
                    if (mutation.type !== 'childList') return;

                    // Sadece note-editable'in direkt child'larina bak
                    if (mutation.target !== $editor[0]) return;

                    for (var i = 0; i < mutation.addedNodes.length; i++) {
                        var node = mutation.addedNodes[i];

                        // sn-grid ise atla (grid ekleme)
                        if ($(node).hasClass('sn-grid') || $(node).hasClass('sn-grid-col')) continue;

                        if (self.isMediaNode(node)) {
                            // Media node'u kolona tasi
                            var col = self.lastActiveCol;

                            // Observer'i gecici durdur (sonsuz dongu onle)
                            self.observer.disconnect();

                            col.appendChild(node);

                            // Observer'i tekrar baslat
                            self.observer.observe($editor[0], { childList: true, subtree: false });
                        }
                    }
                });
            });

            self.observer.observe($editor[0], { childList: true, subtree: false });
        };

        // ---- Initialize ----
        this.initialize = function() {
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

            // MutationObserver baslat
            self.startObserver();
        };

        // ---- Destroy ----
        this.destroy = function() {
            if (self.observer) {
                self.observer.disconnect();
                self.observer = null;
            }
        };

        // ---- HTML cikti temizleme ----
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
                // Grid disina tiklanirsa kolon ref'ini temizle
                if (!$(e.target).closest('.note-toolbar').length) {
                    self.lastActiveCol = null;
                }
            }
        });
    };

    $.extend(true, $.summernote, {
        plugins: {
            gridPlugin: GridPlugin
        }
    });

})(jQuery);
