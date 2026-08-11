/* ============================================================
   compose.js — the admin blog composer
   - gates the page to editor/admin roles
   - a small rich-text editor over a contenteditable canvas
   - a live preview rendered in the reading-view prose style
   ============================================================ */

(function () {
  'use strict';

  var LW = window.LW, D = window.LWDATA;

  /* Exposed as LW.bootCompose() and re-run by the app after every
     client-side navigation — see the note in common.js's LW.boot. */
  LW.bootCompose = function () {

    /* ---------- 1. admin gate -------------------------------
       In this template the signed-in person is D.me. We treat
       Editors as admins. Swap this check for a real session/role
       lookup when wiring to a backend. */
    var meName = (D && D.me && D.me.name) || '';
    var meRecord = (D && D.writers || []).filter(function (w) {
      return w.name === meName;
    })[0];
    var role = meRecord ? meRecord.role : 'Editor';
    var isAdmin = /editor|admin/i.test(role);

    var gate = LW.$('#gate');
    var work = LW.$('#composer');

    // Not on the compose page at all (this boot function is re-run on every
    // route, not just this one — see the note above) — nothing to wire up.
    if (!gate && !work) return;

    if (!isAdmin) {
      if (work) work.hidden = true;
      if (gate) gate.hidden = false;
      return;                       /* stop — nothing below runs */
    }
    if (gate) gate.hidden = true;
    if (work) work.hidden = false;

    /* ---------- 2. element handles -------------------------- */
    var area    = LW.$('#editorArea');
    var titleEl = LW.$('#fTitle');
    var dekEl   = LW.$('#fDek');
    var catEl   = LW.$('#fCat');
    var imgEl   = LW.$('#fImg');
    var toolbar = LW.$('#toolbar');
    var linkpop = LW.$('#linkpop');
    var linkInp = LW.$('#linkInput');
    var tablepop = LW.$('#tablepop');
    var tblCols = LW.$('#tblCols');
    var tblRows = LW.$('#tblRows');
    var tblHead = LW.$('#tblHead');
    var tabletools = LW.$('#tabletools');
    var colresize = LW.$('#colresize');
    var btnUndo = LW.$('#btnUndo');
    var btnRedo = LW.$('#btnRedo');

    /* preview mirrors */
    var pvArtWrap = LW.$('#pvArtWrap');
    var pvTitle   = LW.$('#pvTitle');
    var pvDek     = LW.$('#pvDek');
    var pvCat     = LW.$('#pvCat');
    var pvBody    = LW.$('#pvBody');
    var pvAvatar  = LW.$('#pvAvatar');
    var pvName    = LW.$('#pvName');
    var pvMeta    = LW.$('#pvMeta');

    /* counts */
    var wordEl = LW.$('#wordCount');
    var readEl = LW.$('#readTime');

    /* ---------- 3. categories --------------------------------
       Populated by Angular from the real Categories API (see
       ComposeComponent) via [formControlName]/@for, not from here. */

    /* fixed byline from the signed-in user */
    if (pvName) pvName.textContent = meName;
    if (pvAvatar) {
      pvAvatar.textContent = LW.initials(meName);
      pvAvatar.style.background = (D.me && D.me.tint) || LW.tint(meName);
    }

    /* ---------- 4. formatting commands ---------------------- */
    /* execCommand is deprecated but still the simplest reliable
       path for a template editor; it degrades gracefully. */
    function exec(cmd, val) {
      area.focus();
      try { document.execCommand(cmd, false, val || null); } catch (e) {}
      sync();
      refreshToolbar();
      checkpoint();
    }

    /* wrap the current block in a given tag (h2/h3/blockquote/p) */
    function block(tag) {
      area.focus();
      try { document.execCommand('formatBlock', false, tag); } catch (e) {}
      sync();
      refreshToolbar();
      checkpoint();
    }

    toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-cmd]');
      if (!btn) return;
      e.preventDefault();
      var cmd = btn.getAttribute('data-cmd');
      var arg = btn.getAttribute('data-arg');

      switch (cmd) {
        case 'undo':
          doUndo();
          break;
        case 'redo':
          doRedo();
          break;
        case 'bold':
        case 'italic':
        case 'underline':
        case 'strikeThrough':
        case 'insertUnorderedList':
        case 'insertOrderedList':
          exec(cmd);
          break;
        case 'block':
          block(arg);
          break;
        case 'inlinecode':
          wrapInlineCode();
          break;
        case 'codeblock':
          insertCodeBlock();
          break;
        case 'hr':
          insertHR();
          break;
        case 'link':
          openLink();
          break;
        case 'image':
          insertImage();
          break;
        case 'table':
          openTable();
          break;
        case 'clear':
          exec('removeFormat');
          block('p');
          break;
      }
    });

    /* keep buttons lit to match the caret's current context */
    function refreshToolbar() {
      [['bold', 'bold'], ['italic', 'italic'], ['underline', 'underline'],
       ['strikeThrough', 'strikeThrough'],
       ['insertUnorderedList', 'insertUnorderedList'],
       ['insertOrderedList', 'insertOrderedList']
      ].forEach(function (pair) {
        var on = false;
        try { on = document.queryCommandState(pair[0]); } catch (e) {}
        var b = toolbar.querySelector('[data-cmd="' + pair[1] + '"]');
        if (b) b.classList.toggle('is-on', on);
      });

      /* block-level highlight */
      var b = currentBlockTag();
      LW.$$('[data-cmd="block"]', toolbar).forEach(function (btn) {
        btn.classList.toggle('is-on', btn.getAttribute('data-arg') === b);
      });
    }

    function currentBlockTag() {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return 'p';
      var node = sel.anchorNode;
      while (node && node !== area) {
        if (node.nodeType === 1) {
          var t = node.tagName.toLowerCase();
          if (/^(h2|h3|blockquote|p|li)$/.test(t)) return t === 'li' ? 'p' : t;
        }
        node = node.parentNode;
      }
      return 'p';
    }

    /* ---------- 5. link popover ---------------------------- */
    var savedRange = null;

    function saveRange() {
      var sel = window.getSelection();
      if (sel && sel.rangeCount) savedRange = sel.getRangeAt(0).cloneRange();
    }
    function restoreRange() {
      if (!savedRange) return;
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedRange);
    }

    function openLink() {
      saveRange();
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        LW.toast('Select the text you want to link first.', true);
        return;
      }
      var r = sel.getRangeAt(0).getBoundingClientRect();
      linkpop.classList.add('is-on');
      var x = Math.max(16, Math.min(r.left, window.innerWidth - 340));
      var y = r.bottom + 8;
      linkpop.style.left = x + 'px';
      linkpop.style.top = y + 'px';
      linkInp.value = '';
      setTimeout(function () { linkInp.focus(); }, 0);
    }
    function closeLink() { linkpop.classList.remove('is-on'); }

    LW.$('#linkApply').addEventListener('click', applyLink);
    LW.$('#linkCancel').addEventListener('click', closeLink);

    /* table popover: insert / cancel / +- steppers */
    LW.$('#tblInsert').addEventListener('click', insertTable);
    LW.$('#tblCancel').addEventListener('click', closeTable);
    tablepop.addEventListener('click', function (e) {
      var step = e.target.closest('[data-step]');
      if (!step) return;
      var input = step.getAttribute('data-step') === 'cols' ? tblCols : tblRows;
      var dir = parseInt(step.getAttribute('data-dir'), 10);
      var lo = input === tblCols ? 1 : 1;
      var hi = input === tblCols ? 8 : 20;
      input.value = clampNum((parseInt(input.value, 10) || 0) + dir, lo, hi, dir > 0 ? 2 : 1);
    });
    linkInp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
      if (e.key === 'Escape') closeLink();
    });

    function applyLink() {
      var url = linkInp.value.trim();
      if (!url) { closeLink(); return; }
      if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) url = 'https://' + url;
      area.focus();
      restoreRange();
      exec('createLink', url);
      /* make links open safely */
      LW.$$('a', area).forEach(function (a) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
      });
      closeLink();
      sync();
    }

    /* ---------- 6. inline image -----------------------------
       Bridges to the Angular upload dialog (window.LW.openImageUpload,
       set up by ComposeComponent) instead of a raw URL prompt. The
       selection is saved before the dialog steals focus and restored
       once it resolves, so the image lands back where the caret was. */
    function insertImage() {
      if (!LW.openImageUpload) return;
      saveRange();
      LW.openImageUpload(function (url) {
        if (!url) return;
        area.focus();
        restoreRange();
        exec('insertHTML',
          '<img src="' + LW.esc(url) + '" alt="" loading="lazy" onerror="this.remove()">');
      });
    }

    /* ---------- 6b. inline code, code block, divider ------- */
    function wrapInlineCode() {
      area.focus();
      var sel = window.getSelection();
      if (!sel || sel.isCollapsed) { LW.toast('Select some text to mark as code.', true); return; }
      var text = sel.toString();
      exec('insertHTML', '<code>' + LW.esc(text) + '</code>');
    }

    function insertCodeBlock() {
      area.focus();
      var sel = window.getSelection();
      var picked = (sel && !sel.isCollapsed) ? sel.toString() : '';
      var body = picked ? LW.esc(picked) : 'code here';
      /* the trailing paragraph gives the caret somewhere to land after the block */
      exec('insertHTML', '<pre><code>' + body + '</code></pre><p><br></p>');
    }

    function insertHR() {
      area.focus();
      exec('insertHTML', '<hr><p><br></p>');
    }

    /* ---------- 6c. table builder -------------------------- */
    function openTable() {
      saveRange();
      var anchor = toolbar.querySelector('[data-cmd="table"]');
      var r = anchor.getBoundingClientRect();
      tablepop.classList.add('is-on');
      var x = Math.max(16, Math.min(r.left, window.innerWidth - 276));
      var y = r.bottom + 8;
      tablepop.style.left = x + 'px';
      tablepop.style.top = y + 'px';
    }
    function closeTable() { tablepop.classList.remove('is-on'); }

    function buildTable(cols, rows, withHead) {
      var html = '<table><colgroup>';
      for (var g = 0; g < cols; g++) html += '<col>';
      html += '</colgroup>';
      var r = 0;
      if (withHead) {
        html += '<thead><tr>';
        for (var c = 0; c < cols; c++) html += '<th>Heading ' + (c + 1) + '</th>';
        html += '</tr></thead>';
        r = 1;                          /* header consumes one row */
      }
      html += '<tbody>';
      for (; r < rows; r++) {
        html += '<tr>';
        for (var c2 = 0; c2 < cols; c2++) html += '<td>Cell</td>';
        html += '</tr>';
      }
      html += '</tbody></table><p><br></p>';
      return html;
    }

    function insertTable() {
      var cols = clampNum(tblCols.value, 1, 8, 3);
      var rows = clampNum(tblRows.value, 1, 20, 3);
      var withHead = tblHead.checked;
      /* a header row counts toward the total; make sure there's at least one body row */
      if (withHead && rows < 2) rows = 2;
      area.focus();
      restoreRange();
      exec('insertHTML', buildTable(cols, rows, withHead));
      closeTable();
      LW.toast('Table added — click any cell to edit it.');
    }

    function clampNum(v, lo, hi, dflt) {
      v = parseInt(v, 10);
      if (isNaN(v)) v = dflt;
      return Math.max(lo, Math.min(hi, v));
    }

    /* ========================================================
       6d. UNDO / REDO — a small custom history stack.
       execCommand keeps its own native undo, but our table
       edits and resizes mutate the DOM directly, so we run a
       single unified stack over the editor's innerHTML and a
       character-offset caret. Native Ctrl+Z is intercepted so
       the two never fight.
       ======================================================== */
    var histStack = [];      /* [{ html, caret }] */
    var histIdx = -1;        /* pointer to the current state    */
    var HIST_MAX = 120;
    var typingTimer = null;

    function caretOffset() {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      var range = sel.getRangeAt(0);
      if (!area.contains(range.startContainer)) return null;
      var pre = range.cloneRange();
      pre.selectNodeContents(area);
      pre.setEnd(range.startContainer, range.startOffset);
      return pre.toString().length;
    }

    function placeCaret(pos) {
      if (pos == null) return;
      var walker = document.createTreeWalker(area, NodeFilter.SHOW_TEXT, null, false);
      var node, count = 0;
      while ((node = walker.nextNode())) {
        var next = count + node.length;
        if (pos <= next) {
          var range = document.createRange();
          range.setStart(node, Math.max(0, Math.min(node.length, pos - count)));
          range.collapse(true);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          return;
        }
        count = next;
      }
      /* fell off the end — land the caret at the very end */
      var r2 = document.createRange();
      r2.selectNodeContents(area);
      r2.collapse(false);
      var s2 = window.getSelection();
      s2.removeAllRanges();
      s2.addRange(r2);
    }

    /* record the current DOM as a new history state */
    function checkpoint() {
      var html = area.innerHTML;
      if (histIdx >= 0 && histStack[histIdx].html === html) return;
      histStack = histStack.slice(0, histIdx + 1);
      histStack.push({ html: html, caret: caretOffset() });
      histIdx = histStack.length - 1;
      if (histStack.length > HIST_MAX) { histStack.shift(); histIdx--; }
      updateHistoryButtons();
    }

    /* flush a pending typing checkpoint immediately */
    function flushTyping() {
      if (typingTimer) { clearTimeout(typingTimer); typingTimer = null; checkpoint(); }
    }

    function applyState(state) {
      hideTableUI();
      area.innerHTML = state.html;
      placeCaret(state.caret);
      sync();
      refreshToolbar();
      positionTableUI();
    }

    function doUndo() {
      flushTyping();
      if (histIdx <= 0) return;
      histIdx--;
      applyState(histStack[histIdx]);
      updateHistoryButtons();
    }
    function doRedo() {
      if (histIdx >= histStack.length - 1) return;
      histIdx++;
      applyState(histStack[histIdx]);
      updateHistoryButtons();
    }
    function updateHistoryButtons() {
      if (btnUndo) btnUndo.disabled = histIdx <= 0;
      if (btnRedo) btnRedo.disabled = histIdx >= histStack.length - 1;
    }

    /* ========================================================
       6e. TABLE STRUCTURE — the cell under the caret is the
       anchor for every add / remove operation.
       ======================================================== */
    function activeCell() {
      var sel = window.getSelection();
      if (!sel || !sel.rangeCount) return null;
      var node = sel.anchorNode;
      while (node && node !== area) {
        if (node.nodeType === 1 && /^(td|th)$/i.test(node.tagName)) return node;
        node = node.parentNode;
      }
      return null;
    }
    function tableOf(cell) {
      var n = cell;
      while (n && n !== area) { if (n.tagName === 'TABLE') return n; n = n.parentNode; }
      return null;
    }
    function cellIndex(cell) {
      var row = cell.parentNode;
      return Array.prototype.indexOf.call(row.children, cell);
    }
    function columnCount(table) {
      var max = 0;
      LW.$$('tr', table).forEach(function (tr) { max = Math.max(max, tr.children.length); });
      return max;
    }
    function newCell(tag, table) {
      var el = document.createElement(tag);
      el.textContent = tag === 'th' ? 'Heading' : 'Cell';
      return el;
    }
    function ensureColgroup(table, cols) {
      var cg = table.querySelector('colgroup');
      if (!cg) {
        cg = document.createElement('colgroup');
        table.insertBefore(cg, table.firstChild);
      }
      while (cg.children.length < cols) cg.appendChild(document.createElement('col'));
      while (cg.children.length > cols) cg.removeChild(cg.lastChild);
      return cg;
    }

    function tableOp(kind) {
      var cell = activeCell();
      if (!cell) return;
      var table = tableOf(cell);
      if (!table) return;
      var row = cell.parentNode;
      var idx = cellIndex(cell);
      var cols = columnCount(table);

      if (kind === 'row-above' || kind === 'row-below') {
        var isHeadRow = row.parentNode.tagName === 'THEAD';
        var tr = document.createElement('tr');
        for (var i = 0; i < cols; i++) tr.appendChild(newCell('td', table));
        if (kind === 'row-above') {
          if (isHeadRow) {
            /* nothing sits above a header — drop it into the body top */
            var tb = table.querySelector('tbody') || table.appendChild(document.createElement('tbody'));
            tb.insertBefore(tr, tb.firstChild);
          } else {
            row.parentNode.insertBefore(tr, row);
          }
        } else {
          row.parentNode.insertBefore(tr, row.nextSibling);
        }
      }

      else if (kind === 'row-del') {
        var bodyRows = LW.$$('tr', table);
        if (bodyRows.length <= 1) { LW.toast('A table needs at least one row.', true); return; }
        var section = row.parentNode;
        row.remove();
        if (section.tagName === 'THEAD' && !section.children.length) section.remove();
      }

      else if (kind === 'col-left' || kind === 'col-right') {
        if (cols >= 10) { LW.toast('Ten columns is the limit.', true); return; }
        var at = kind === 'col-left' ? idx : idx + 1;
        LW.$$('tr', table).forEach(function (tr2) {
          var isHead = tr2.parentNode.tagName === 'THEAD';
          var c = newCell(isHead ? 'th' : 'td', table);
          var ref = tr2.children[at] || null;
          tr2.insertBefore(c, ref);
        });
        ensureColgroup(table, cols + 1);
        /* keep colgroup widths sane after a structural change */
        clearColWidths(table);
      }

      else if (kind === 'col-del') {
        if (cols <= 1) { LW.toast('A table needs at least one column.', true); return; }
        LW.$$('tr', table).forEach(function (tr3) {
          if (tr3.children[idx]) tr3.children[idx].remove();
        });
        ensureColgroup(table, cols - 1);
        clearColWidths(table);
      }

      else if (kind === 'table-del') {
        var after = table.nextElementSibling;
        table.remove();
        if (after) placeCaretIn(after); else area.focus();
        hideTableUI();
        sync(); checkpoint();
        LW.toast('Table deleted.');
        return;
      }

      /* keep the caret inside a sensible cell, then record */
      restoreCaretToTable(table, idx);
      sync();
      checkpoint();
      positionTableUI();
    }

    function placeCaretIn(node) {
      var range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(true);
      var sel = window.getSelection();
      sel.removeAllRanges(); sel.addRange(range);
    }
    function restoreCaretToTable(table, idx) {
      var anyCell = table.querySelector('td, th');
      if (anyCell) placeCaretIn(anyCell);
    }

    /* ========================================================
       6f. COLUMN RESIZE — freeze current widths into <col>
       elements, switch to fixed layout, then drag boundaries.
       ======================================================== */
    function clearColWidths(table) {
      /* after add/remove column, drop frozen widths so the
         browser re-balances; user can resize again */
      table.style.tableLayout = '';
      table.style.width = '';
      delete table.dataset.frozen;
      LW.$$('col', table).forEach(function (c) { c.style.width = ''; });
    }

    function freezeWidths(table) {
      if (table.dataset.frozen) return;
      var firstRow = table.querySelector('tr');
      if (!firstRow) return;
      var cells = Array.prototype.slice.call(firstRow.children);
      var cg = ensureColgroup(table, cells.length);
      var cols = Array.prototype.slice.call(cg.children);
      var total = 0;
      cells.forEach(function (cell, i) {
        var w = Math.round(cell.getBoundingClientRect().width);
        if (cols[i]) cols[i].style.width = w + 'px';
        total += w;
      });
      table.style.width = total + 'px';
      table.style.tableLayout = 'fixed';
      table.dataset.frozen = '1';
    }

    var drag = null;   /* { table, cols, i, startX, wA, wB, edge } */

    function startColDrag(e, table, boundaryIndex, edge) {
      e.preventDefault();
      e.stopPropagation();
      freezeWidths(table);
      var cg = table.querySelector('colgroup');
      var cols = Array.prototype.slice.call(cg.children);
      drag = {
        table: table,
        cols: cols,
        i: boundaryIndex,
        edge: edge,
        startX: e.clientX,
        wA: parseFloat(cols[boundaryIndex].style.width) || 0,
        wB: edge ? 0 : (parseFloat(cols[boundaryIndex + 1].style.width) || 0),
        tableW: parseFloat(table.style.width) || 0
      };
      document.body.classList.add('is-colresizing');
      window.addEventListener('mousemove', onColDrag);
      window.addEventListener('mouseup', endColDrag);
    }
    function onColDrag(e) {
      if (!drag) return;
      var dx = e.clientX - drag.startX;
      var MIN = 44;
      if (drag.edge) {
        /* dragging the table's right edge widens the last column */
        var w = Math.max(MIN, drag.wA + dx);
        drag.cols[drag.i].style.width = w + 'px';
        drag.table.style.width = (drag.tableW - drag.wA + w) + 'px';
      } else {
        /* internal boundary: move width between the two neighbours */
        var a = drag.wA + dx, b = drag.wB - dx;
        if (a < MIN) { b -= (MIN - a); a = MIN; }
        if (b < MIN) { a -= (MIN - b); b = MIN; }
        drag.cols[drag.i].style.width = a + 'px';
        drag.cols[drag.i + 1].style.width = b + 'px';
      }
      positionColGrips(drag.table);
    }
    function endColDrag() {
      if (!drag) return;
      var t = drag.table;
      drag = null;
      document.body.classList.remove('is-colresizing');
      window.removeEventListener('mousemove', onColDrag);
      window.removeEventListener('mouseup', endColDrag);
      sync();
      checkpoint();
      positionTableUI();
    }

    /* ========================================================
       6g. POSITION the floating tools + resize grips over the
       active table. Everything is fixed-position and recomputed
       whenever the selection, content, or scroll changes.
       ======================================================== */
    var activeTable = null;

    function currentTable() {
      var cell = activeCell();
      return cell ? tableOf(cell) : null;
    }

    function positionTableUI() {
      var table = currentTable();
      activeTable = table;
      if (!table) { hideTableUI(); return; }

      var er = area.getBoundingClientRect();
      var tr = table.getBoundingClientRect();

      /* hide if the table has scrolled out of the editor viewport */
      if (tr.bottom < er.top + 4 || tr.top > er.bottom - 4) { hideTableUI(); return; }

      /* --- toolbar: pinned just above the table's top-left --- */
      tabletools.classList.add('is-on');
      tabletools.setAttribute('aria-hidden', 'false');
      var th = tabletools.offsetHeight || 40;
      var top = tr.top - th - 8;
      if (top < er.top + 4) top = tr.top + 6;          /* not enough room above */
      top = Math.max(er.top + 4, Math.min(top, er.bottom - th - 4));
      var left = Math.max(er.left, Math.min(tr.left, er.right - tabletools.offsetWidth - 4));
      tabletools.style.top = top + 'px';
      tabletools.style.left = left + 'px';

      positionColGrips(table);
    }

    function positionColGrips(table) {
      var firstRow = table.querySelector('tr');
      if (!firstRow) return;
      var er = area.getBoundingClientRect();
      var tr = table.getBoundingClientRect();
      var top = Math.max(tr.top, er.top);
      var bottom = Math.min(tr.bottom, er.bottom);
      var height = Math.max(0, bottom - top);

      colresize.classList.add('is-on');
      colresize.setAttribute('aria-hidden', 'false');
      colresize.innerHTML = '';

      var cells = Array.prototype.slice.call(firstRow.children);
      cells.forEach(function (cell, i) {
        var cr = cell.getBoundingClientRect();
        var isEdge = (i === cells.length - 1);
        /* skip a boundary that sits outside the editor's visible x-range */
        if (cr.right < er.left || cr.right > er.right + 1) return;
        var grip = document.createElement('div');
        grip.className = 'colgrip';
        grip.style.left = cr.right + 'px';
        grip.style.top = top + 'px';
        grip.style.height = height + 'px';
        (function (index, edge) {
          grip.addEventListener('mousedown', function (e) {
            startColDrag(e, table, index, edge);
          });
        })(i, isEdge);
        colresize.appendChild(grip);
      });
    }

    function hideTableUI() {
      tabletools.classList.remove('is-on');
      tabletools.setAttribute('aria-hidden', 'true');
      colresize.classList.remove('is-on');
      colresize.setAttribute('aria-hidden', 'true');
      colresize.innerHTML = '';
    }

    /* the floating toolbar's buttons */
    tabletools.addEventListener('mousedown', function (e) {
      /* keep the caret/selection in the table while clicking a tool */
      if (e.target.closest('[data-tt]')) e.preventDefault();
    });
    tabletools.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tt]');
      if (!btn) return;
      tableOp(btn.getAttribute('data-tt'));
    });

    /* recompute placement as things move */
    var rafPending = false;
    function scheduleTableUI() {
      if (rafPending) return;
      rafPending = true;
      requestAnimationFrame(function () { rafPending = false; positionTableUI(); });
    }
    document.addEventListener('selectionchange', function () {
      if (document.activeElement === area || area.contains(document.activeElement)) scheduleTableUI();
    });
    area.addEventListener('scroll', scheduleTableUI);
    window.addEventListener('scroll', scheduleTableUI, true);
    window.addEventListener('resize', scheduleTableUI);


    /* ---------- 7. cover image field ----------------------- */
    function syncCover() {
      var url = (imgEl.value || '').trim();
      pvArtWrap.innerHTML = '';
      if (url) {
        var img = document.createElement('img');
        img.src = url; img.alt = '';
        img.onerror = function () { renderEmptyCover(); };
        pvArtWrap.appendChild(img);
        pvArtWrap.classList.remove('pv__art--empty');
        var mark = document.createElement('span');
        mark.className = 'pv__catmark';
        mark.textContent = catEl.value || 'Category';
        pvArtWrap.appendChild(mark);
      } else {
        renderEmptyCover();
      }
    }
    function renderEmptyCover() {
      pvArtWrap.innerHTML = '<span>Cover image preview</span>';
      pvArtWrap.classList.add('pv__art--empty');
    }

    /* ---------- 8. live preview + counts ------------------- */
    function sanitize(html) {
      /* strip script/style and inline event handlers before preview */
      var tmp = document.createElement('div');
      tmp.innerHTML = html;
      LW.$$('script, style, .colgrip', tmp).forEach(function (n) { n.remove(); });
      LW.$$('*', tmp).forEach(function (el) {
        Array.prototype.slice.call(el.attributes).forEach(function (at) {
          if (/^on/i.test(at.name)) el.removeAttribute(at.name);
        });
        /* editor-only bookkeeping shouldn't reach the published HTML */
        el.removeAttribute('data-frozen');
      });
      return tmp.innerHTML;
    }

    function sync() {
      /* title / dek / category */
      var t = (titleEl.value || '').trim();
      if (pvTitle) {
        pvTitle.textContent = t || 'Your headline goes here';
        pvTitle.classList.toggle('pv__title--ghost', !t);
      }
      if (pvDek) {
        var d = (dekEl.value || '').trim();
        pvDek.textContent = d;
        pvDek.style.display = d ? '' : 'none';
      }
      if (pvCat) pvCat.textContent = catEl.value || 'Draft';
      if (pvMeta) {
        pvMeta.textContent = (new Date()).toLocaleDateString('en-GB',
          { day: 'numeric', month: 'long', year: 'numeric' }) + ' · ' + readEl.textContent;
      }

      /* body */
      var html = sanitize(area.innerHTML);
      if (pvBody) pvBody.innerHTML = html;

      /* counts */
      var text = (area.textContent || '').trim();
      var words = text ? text.split(/\s+/).length : 0;
      var mins = Math.max(1, Math.round(words / 200));
      if (wordEl) wordEl.textContent = words + (words === 1 ? ' word' : ' words');
      if (readEl) readEl.textContent = mins + ' min read';

      /* refresh the catmark on the cover if present */
      var mark = pvArtWrap.querySelector('.pv__catmark');
      if (mark) mark.textContent = catEl.value || 'Category';
    }

    /* ---------- 9. wire inputs ----------------------------- */
    area.addEventListener('input', function () {
      sync();
      positionTableUI();
      /* coalesce a burst of typing into a single history entry */
      if (typingTimer) clearTimeout(typingTimer);
      typingTimer = setTimeout(function () { typingTimer = null; checkpoint(); }, 450);
    });
    area.addEventListener('keyup', refreshToolbar);
    area.addEventListener('mouseup', refreshToolbar);
    area.addEventListener('click', scheduleTableUI);
    titleEl.addEventListener('input', sync);
    dekEl.addEventListener('input', sync);
    catEl.addEventListener('change', function () { syncCover(); sync(); });
    imgEl.addEventListener('input', syncCover);

    /* keyboard shortcuts */
    area.addEventListener('keydown', function (e) {
      if (!(e.metaKey || e.ctrlKey)) return;
      var k = e.key.toLowerCase();
      if (k === 'z' && !e.shiftKey) { e.preventDefault(); doUndo(); }
      else if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); doRedo(); }
      else if (k === 'b') { e.preventDefault(); exec('bold'); }
      else if (k === 'i') { e.preventDefault(); exec('italic'); }
      else if (k === 'u') { e.preventDefault(); exec('underline'); }
      else if (k === 'k') { e.preventDefault(); openLink(); }
    });

    /* paste as plain-ish text to keep the prose style clean */
    area.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = (e.clipboardData || window.clipboardData).getData('text/plain');
      exec('insertText', text);
    });

    /* dismiss the popovers + table UI on outside click */
    document.addEventListener('mousedown', function (e) {
      if (linkpop.classList.contains('is-on') &&
          !e.target.closest('#linkpop') &&
          !e.target.closest('[data-cmd="link"]')) {
        closeLink();
      }
      if (tablepop.classList.contains('is-on') &&
          !e.target.closest('#tablepop') &&
          !e.target.closest('[data-cmd="table"]')) {
        closeTable();
      }
      /* clicking right away from the editor and its table tools hides them */
      if (!e.target.closest('#editorArea') &&
          !e.target.closest('#tabletools') &&
          !e.target.closest('#colresize')) {
        hideTableUI();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeTable();
    });

    /* ---------- 10. actions ---------------------------------
       Publish / Save draft / Clear are all owned by Angular
       (ComposeComponent) \u2014 it reads titleEl/dekEl/catEl (bound as
       reactive form controls), imgEl (coverImagePath) and
       area.innerHTML directly, and calls the real API. Clear itself
       (confirm() + discarding any uploaded-but-unsaved images) is
       Angular's call \u2014 LW.resetComposeEditor below is just the DOM/
       history reset this file already knows how to do, exposed as a
       bridge so Angular can trigger it after its own confirm+cleanup.
       Every field it touches that Angular also binds needs a
       dispatched event afterwards, or Angular's copy of that value
       goes stale. */
    LW.resetComposeEditor = function () {
      titleEl.value = ''; dekEl.value = ''; imgEl.value = '';
      catEl.selectedIndex = 0; catEl.classList.remove('has-val');
      area.innerHTML = '<p></p>';
      hideTableUI();
      syncCover(); sync(); refreshToolbar();
      checkpoint();
      titleEl.dispatchEvent(new Event('input'));
      dekEl.dispatchEvent(new Event('input'));
      catEl.dispatchEvent(new Event('change'));
      imgEl.dispatchEvent(new Event('input'));
    };

    /* ---------- 11. first paint ---------------------------- */
    /* Without this, Chrome's default behaviour on Enter is to start a new
       <div> rather than a <p> — invisible in the editor itself, but the
       reading view's prose styling (post.css's .prose p rule) only
       targets <p>, so every paragraph after the first would silently
       fall back to the browser's plain default font/size once published. */
    try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch (e) {}
    if (!area.innerHTML.trim()) area.innerHTML = '<p></p>';
    renderEmptyCover();
    syncCover();
    sync();
    refreshToolbar();
    checkpoint();                 /* seed the initial history state */
    updateHistoryButtons();
  };
})();
