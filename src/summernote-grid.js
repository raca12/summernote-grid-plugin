/**
 * Summernote Grid Plugin v3
 *
 * Basit Bootstrap grid layout eklentisi.
 * Temiz div yapilarla calisir, contenteditable izolasyonu YOK.
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
                    contents: buildDropdown(),
                    callback: function($dropdown) {
                        $dropdown.find('[data-grid-index]').on('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            insertGrid(gridLayouts[$(this).data('grid-index')]);
                        });
                    }
                })
            ]).render();
        });

        function buildDropdown() {
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
        }

        function insertGrid(layout) {
            var row = document.createElement('div');
            row.className = 'row sn-grid';

            for (var i = 0; i < layout.cols.length; i++) {
                var col = document.createElement('div');
                col.className = 'col-md-' + layout.cols[i] + ' sn-grid-col';
                col.innerHTML = '<p>Kolon ' + (i + 1) + '</p>';
                row.appendChild(col);
            }

            context.invoke('editor.insertNode', row);

            // Grid sonrasina bos paragraf (cursor devam edebilsin)
            var after = document.createElement('p');
            after.innerHTML = '<br>';
            $(row).after(after);
        }
    };

    $.extend(true, $.summernote, {
        plugins: {
            gridPlugin: GridPlugin
        }
    });

})(jQuery);
