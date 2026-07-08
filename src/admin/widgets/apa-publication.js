/*
 * Custom Decap CMS widget for the Research page's "Publications" list.
 * Lets an editor paste an APA 7th-edition reference and auto-fills the
 * Year / Title / Authors / Venue fields, which remain individually editable.
 *
 * Registered as the singular `field:` of the publications list widget, so
 * each list item's stored value is exactly the flat object this widget
 * manages (no extra nesting in the saved YAML).
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

    return { year: year, title: title, authors: authors, venue: venue };
  }

  function getField(value, key) {
    if (value && typeof value.get === 'function') return value.get(key) || '';
    return (value && value[key]) || '';
  }

  function setField(value, key, val) {
    if (value && typeof value.set === 'function') return value.set(key, val);
    var next = {};
    if (value) {
      Object.keys(value).forEach(function (k) {
        next[k] = value[k];
      });
    }
    next[key] = val;
    return next;
  }

  var ApaPublicationControl = createClass({
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
      var value = this.props.value;
      value = setField(value, 'year', parsed.year);
      value = setField(value, 'title', parsed.title);
      value = setField(value, 'authors', parsed.authors);
      value = setField(value, 'venue', parsed.venue);
      this.props.onChange(value);
      this.setState({ status: 'Filled in from citation — double-check before saving.' });
    },

    handleFieldChange: function (key) {
      var self = this;
      return function (e) {
        self.props.onChange(setField(self.props.value, key, e.target.value));
      };
    },

    render: function () {
      var value = this.props.value;
      var inputStyle = {
        display: 'block',
        width: '100%',
        marginBottom: '8px',
        padding: '8px 10px',
        border: '1px solid #dfdfe3',
        borderRadius: '4px',
        fontSize: '14px',
      };
      var labelStyle = {
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: '#8b8b8f',
        marginBottom: '4px',
      };

      return h('div', { className: this.props.classNameWrapper }, [
        h(
          'div',
          {
            key: 'paste-box',
            style: {
              border: '1px dashed #b3b3b8',
              borderRadius: '6px',
              padding: '10px',
              marginBottom: '14px',
              background: '#fafafa',
            },
          },
          [
            h(
              'label',
              { key: 'paste-label', style: labelStyle },
              'Paste APA 7th ed. citation to auto-fill the fields below'
            ),
            h('textarea', {
              key: 'paste-input',
              rows: 3,
              style: Object.assign({}, inputStyle, { fontFamily: 'inherit', marginBottom: '6px' }),
              placeholder:
                'Dart, L. (2025). The power of care for climate justice. The Nature of Cities.',
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
        ),

        h('label', { key: 'year-label', style: labelStyle }, 'Year'),
        h('input', {
          key: 'year-input',
          type: 'text',
          style: inputStyle,
          value: getField(value, 'year'),
          onChange: this.handleFieldChange('year'),
        }),

        h('label', { key: 'title-label', style: labelStyle }, 'Title'),
        h('input', {
          key: 'title-input',
          type: 'text',
          style: inputStyle,
          value: getField(value, 'title'),
          onChange: this.handleFieldChange('title'),
        }),

        h('label', { key: 'authors-label', style: labelStyle }, 'Authors'),
        h('input', {
          key: 'authors-input',
          type: 'text',
          style: inputStyle,
          value: getField(value, 'authors'),
          onChange: this.handleFieldChange('authors'),
        }),

        h('label', { key: 'venue-label', style: labelStyle }, 'Venue'),
        h('input', {
          key: 'venue-input',
          type: 'text',
          style: inputStyle,
          value: getField(value, 'venue'),
          onChange: this.handleFieldChange('venue'),
        }),
      ]);
    },
  });

  var ApaPublicationPreview = createClass({
    render: function () {
      var value = this.props.value;
      var authors = getField(value, 'authors');
      var year = getField(value, 'year');
      var title = getField(value, 'title');
      var venue = getField(value, 'venue');
      return h('div', {}, authors + ' (' + year + '). ' + title + '. ' + venue);
    },
  });

  CMS.registerWidget('apa-publication', ApaPublicationControl, ApaPublicationPreview);
})();
