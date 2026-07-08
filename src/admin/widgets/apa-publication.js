/*
 * Custom Decap CMS widget for the Research page's "Publications" list.
 * Lets an editor paste an APA 7th-edition reference and auto-fills the
 * sibling Year / Title / Authors / Venue fields in the same list item.
 *
 * This widget's own value is never persisted (we never call
 * this.props.onChange for it) — it only reaches into its sibling fields'
 * real <input> elements and dispatches native input events, so those
 * fields' own onChange handlers do the actual, officially-supported write.
 * This keeps each publication's saved YAML shape exactly
 * { year, title, authors, venue }, unchanged from before this widget existed.
 */
(function () {
  function parseApaCitation(raw) {
    var text = (raw || '').replace(/\s+/g, ' ').trim();
    if (!text) return null;

    var match = text.match(/^(.*?)\(\s*((?:19|20)\d{2})[a-z]?\s*\)\.?\s*([\s\S]*)$/);
    if (!match) return null;

    var authors = match[1].trim().replace(/,\s*$/, '');
    var year = match[2];
    var remainder = match[3].trim();

    var title = remainder;
    var venue = '';
    var splitIndex = remainder.indexOf('. ');
    if (splitIndex !== -1) {
      title = remainder.slice(0, splitIndex).trim();
      venue = remainder.slice(splitIndex + 2).trim();
    }

    title = title.replace(/\.$/, '').trim();
    venue = venue.replace(/\.$/, '').trim();

    if (!authors || !title) return null;

    return { Year: year, Title: title, Authors: authors, Venue: venue };
  }

  function setNativeInputValue(input, value) {
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function findInputByLabel(scope, labelText) {
    var labels = Array.prototype.slice.call(scope.querySelectorAll('label'));
    var label = labels.filter(function (l) {
      return l.textContent.trim() === labelText;
    })[0];
    if (!label) return null;
    var container =
      (label.closest && label.closest('[aria-label="string field"]')) ||
      (label.parentElement && label.parentElement.parentElement);
    return container ? container.querySelector('input') : null;
  }

  function findItemScope(node) {
    var labelsWanted = ['Year', 'Title', 'Authors', 'Venue'];
    var el = node;
    for (var i = 0; i < 8 && el; i++) {
      var labels = Array.prototype.slice.call(el.querySelectorAll('label')).map(function (l) {
        return l.textContent.trim();
      });
      var hasAll = labelsWanted.every(function (want) {
        return labels.indexOf(want) !== -1;
      });
      if (hasAll) return el;
      el = el.parentElement;
    }
    return null;
  }

  var ApaCitationHelperControl = createClass({
    getInitialState: function () {
      return { pasteText: '', status: '' };
    },

    handlePasteTextChange: function (e) {
      this.setState({ pasteText: e.target.value });
    },

    handleParse: function () {
      var parsed = parseApaCitation(this.state.pasteText);
      if (!parsed) {
        this.setState({ status: "Couldn't read that citation — check the fields below and fill in manually." });
        return;
      }

      var scope = findItemScope(this._root);
      if (!scope) {
        this.setState({ status: "Couldn't find this publication's fields — fill them in manually." });
        return;
      }

      // Each write below triggers Decap's own field onChange synchronously.
      // Firing all four in the same tick races with Decap's state update — the
      // sibling controls read a stale snapshot of the item and only the last
      // write sticks. Staggering across ticks lets each one commit first.
      var self = this;
      var labels = ['Year', 'Title', 'Authors', 'Venue'];
      var missing = [];

      function applyNext(i) {
        if (i >= labels.length) {
          self.setState({
            status:
              missing.length === 0
                ? 'Filled in from citation — double-check before saving.'
                : 'Filled in what it could — missing: ' + missing.join(', '),
          });
          return;
        }
        var label = labels[i];
        var input = findInputByLabel(scope, label);
        if (input) {
          setNativeInputValue(input, parsed[label]);
        } else {
          missing.push(label);
        }
        setTimeout(function () {
          applyNext(i + 1);
        }, 40);
      }

      applyNext(0);
    },

    render: function () {
      var self = this;
      var inputStyle = {
        display: 'block',
        width: '100%',
        marginBottom: '6px',
        padding: '8px 10px',
        border: '1px solid #dfdfe3',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: 'inherit',
      };
      var labelStyle = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: '#8b8b8f',
        marginBottom: '4px',
      };

      return h(
        'div',
        {
          className: this.props.classNameWrapper,
          ref: function (el) {
            self._root = el;
          },
          style: {
            border: '1px dashed #b3b3b8',
            borderRadius: '6px',
            padding: '10px',
            background: '#fafafa',
          },
        },
        [
          h('div', { key: 'paste-label', style: labelStyle }, 'Paste APA 7th ed. citation to auto-fill the fields below'),
          h('textarea', {
            key: 'paste-input',
            rows: 3,
            style: inputStyle,
            placeholder: 'Dart, L. (2025). The power of care for climate justice. The Nature of Cities.',
            value: this.state.pasteText,
            onChange: this.handlePasteTextChange,
          }),
          h(
            'button',
            {
              key: 'parse-button',
              type: 'button',
              onClick: this.handleParse,
              style: {
                padding: '6px 12px',
                fontSize: '13px',
                borderRadius: '4px',
                border: '1px solid #8b8b8f',
                background: '#fff',
                cursor: 'pointer',
              },
            },
            'Fill fields from citation'
          ),
          this.state.status
            ? h('div', { key: 'status', style: { fontSize: '12px', marginTop: '6px', color: '#6b6b6f' } }, this.state.status)
            : null,
        ]
      );
    },
  });

  CMS.registerWidget('apa-citation-helper', ApaCitationHelperControl);
})();
