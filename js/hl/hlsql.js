var hljs = new function() {
  var LANGUAGES = {}
  var selected_languages = {};

  function escape(value) {
    return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
  }

  function contains(array, item) {
    if (!array)
      return false;
    for (var i = 0; i < array.length; i++)
      if (array[i] == item)
        return true;
    return false;
  }

  function highlight(language_name, value) {
    function compileSubModes(mode, language) {
      mode.sub_modes = [];
      for (var i = 0; i < mode.contains.length; i++) {
        for (var j = 0; j < language.modes.length; j++) {
          if (language.modes[j].className == mode.contains[i]) {
            mode.sub_modes[mode.sub_modes.length] = language.modes[j];
          }
        }
      }
    }

    function subMode(lexem, mode) {
      if (!mode.contains) {
        return null;
      }
      if (!mode.sub_modes) {
        compileSubModes(mode, language);
      }
      for (var i = 0; i < mode.sub_modes.length; i++) {
        if (mode.sub_modes[i].beginRe.test(lexem)) {
          return mode.sub_modes[i];
        }
      }
      return null;
    }

    function endOfMode(mode_index, lexem) {
      if (modes[mode_index].end && modes[mode_index].endRe.test(lexem))
        return 1;
      if (modes[mode_index].endsWithParent) {
        var level = endOfMode(mode_index - 1, lexem);
        return level ? level + 1 : 0;
      }
      return 0;
    }

    function isIllegal(lexem, mode) {
      return mode.illegalRe && mode.illegalRe.test(lexem);
    }

    function compileTerminators(mode, language) {
      var terminators = [];

      function addTerminator(re) {
        if (!contains(terminators, re)) {
          terminators[terminators.length] = re;
        }
      }

      if (mode.contains)
        for (var i = 0; i < language.modes.length; i++) {
          if (contains(mode.contains, language.modes[i].className)) {
            addTerminator(language.modes[i].begin);
          }
        }

      var index = modes.length - 1;
      do {
        if (modes[index].end) {
          addTerminator(modes[index].end);
        }
        index--;
      } while (modes[index + 1].endsWithParent);

      if (mode.illegal) {
        addTerminator(mode.illegal);
      }

      var terminator_re = '(' + terminators[0];
      for (var i = 0; i < terminators.length; i++)
        terminator_re += '|' + terminators[i];
      terminator_re += ')';
      return langRe(language, terminator_re);
    }

    function eatModeChunk(value, index) {
      var mode = modes[modes.length - 1];
      if (!mode.terminators) {
        mode.terminators = compileTerminators(mode, language);
      }
      value = value.substr(index);
      var match = mode.terminators.exec(value);
      if (!match)
        return [value, '', true];
      if (match.index == 0)
        return ['', match[0], false];
      else
        return [value.substr(0, match.index), match[0], false];
    }

    function keywordMatch(mode, match) {
      var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0]
      for (var className in mode.keywordGroups) {
        if (!mode.keywordGroups.hasOwnProperty(className))
          continue;
        var value = mode.keywordGroups[className].hasOwnProperty(match_str);
        if (value)
          return [className, value];
      }
      return false;
    }

    function processKeywords(buffer, mode) {
      if (!mode.keywords || !mode.lexems)
        return escape(buffer);
      if (!mode.lexemsRe) {
        var lexems_re = '(' + mode.lexems[0];
        for (var i = 1; i < mode.lexems.length; i++)
          lexems_re += '|' + mode.lexems[i];
        lexems_re += ')';
        mode.lexemsRe = langRe(language, lexems_re, true);
      }
      var result = '';
      var last_index = 0;
      mode.lexemsRe.lastIndex = 0;
      var match = mode.lexemsRe.exec(buffer);
      while (match) {
        result += escape(buffer.substr(last_index, match.index - last_index));
        var keyword_match = keywordMatch(mode, match);
        if (keyword_match) {
          keyword_count += keyword_match[1];
          result += '<span class="'+ keyword_match[0] +'">' + escape(match[0]) + '</span>';
        } else {
          result += escape(match[0]);
        }
        last_index = mode.lexemsRe.lastIndex;
        match = mode.lexemsRe.exec(buffer);
      }
      result += escape(buffer.substr(last_index, buffer.length - last_index));
      return result;
    }

    function processBuffer(buffer, mode) {
      if (mode.subLanguage && selected_languages[mode.subLanguage]) {
        var result = highlight(mode.subLanguage, buffer);
        keyword_count += result.keyword_count;
        relevance += result.relevance;
        return result.value;
      } else {
        return processKeywords(buffer, mode);
      }
    }

    function startNewMode(mode, lexem) {
      var markup = mode.noMarkup?'':'<span class="' + mode.className + '">';
      if (mode.returnBegin) {
        result += markup;
        mode.buffer = '';
      } else if (mode.excludeBegin) {
        result += escape(lexem) + markup;
        mode.buffer = '';
      } else {
        result += markup;
        mode.buffer = lexem;
      }
      modes[modes.length] = mode;
    }

    function processModeInfo(buffer, lexem, end) {
      var current_mode = modes[modes.length - 1];
      if (end) {
        result += processBuffer(current_mode.buffer + buffer, current_mode);
        return false;
      }

      var new_mode = subMode(lexem, current_mode);
      if (new_mode) {
        result += processBuffer(current_mode.buffer + buffer, current_mode);
        startNewMode(new_mode, lexem);
        relevance += new_mode.relevance;
        return new_mode.returnBegin;
      }

      var end_level = endOfMode(modes.length - 1, lexem);
      if (end_level) {
        var markup = current_mode.noMarkup?'':'</span>';
        if (current_mode.returnEnd) {
          result += processBuffer(current_mode.buffer + buffer, current_mode) + markup;
        } else if (current_mode.excludeEnd) {
          result += processBuffer(current_mode.buffer + buffer, current_mode) + markup + escape(lexem);
        } else {
          result += processBuffer(current_mode.buffer + buffer + lexem, current_mode) + markup;
        }
        while (end_level > 1) {
          markup = modes[modes.length - 2].noMarkup?'':'</span>';
          result += markup;
          end_level--;
          modes.length--;
        }
        modes.length--;
        modes[modes.length - 1].buffer = '';
        if (current_mode.starts) {
          for (var i = 0; i < language.modes.length; i++) {
            if (language.modes[i].className == current_mode.starts) {
              startNewMode(language.modes[i], '');
              break;
            }
          }
        }
        return current_mode.returnEnd;
      }

      if (isIllegal(lexem, current_mode))
        throw 'Illegal';
    }

    var language = LANGUAGES[language_name];
    var modes = [language.defaultMode];
    var relevance = 0;
    var keyword_count = 0;
    var result = '';
    try {
      var index = 0;
      language.defaultMode.buffer = '';
      do {
        var mode_info = eatModeChunk(value, index);
        var return_lexem = processModeInfo(mode_info[0], mode_info[1], mode_info[2]);
        index += mode_info[0].length;
        if (!return_lexem) {
          index += mode_info[1].length;
        }
      } while (!mode_info[2]);
      if(modes.length > 1)
        throw 'Illegal';
      return {
        relevance: relevance,
        keyword_count: keyword_count,
        value: result
      }
    } catch (e) {
      if (e == 'Illegal') {
        return {
          relevance: 0,
          keyword_count: 0,
          value: escape(value)
        }
      } else {
        throw e;
      }
    }
  }

  function blockText(block) {
    var result = '';
    for (var i = 0; i < block.childNodes.length; i++)
      if (block.childNodes[i].nodeType == 3)
        result += block.childNodes[i].nodeValue;
      else if (block.childNodes[i].nodeName == 'BR')
        result += '\n';
      else
        throw 'No highlight';
    return result;
  }

  function blockLanguage(block) {
    var classes = block.className.split(/\s+/);
    for (var i = 0; i < classes.length; i++) {
      if (classes[i] == 'no-highlight') {
        throw 'No highlight'
      }
      if (LANGUAGES[classes[i]]) {
        return classes[i];
      }
    }
  }

  function highlightBlock(block, tabReplace) {
    try {
      var text = blockText(block);
      var language = blockLanguage(block);
    } catch (e) {
      if (e == 'No highlight')
        return;
    }

    if (language) {
      var result = highlight(language, text).value;
    } else {
      var max_relevance = 0;
      for (var key in selected_languages) {
        if (!selected_languages.hasOwnProperty(key))
          continue;
        var lang_result = highlight(key, text);
        var relevance = lang_result.keyword_count + lang_result.relevance;
        if (relevance > max_relevance) {
          max_relevance = relevance;
          var result = lang_result.value;
          language = key;
        }
      }
    }

    if (result) {
      if (tabReplace) {
        result = result.replace(/^(\t+)/gm, function(match, p1, offset, s) {
          return p1.replace(/\t/g, tabReplace);
        })
      }
      var class_name = block.className;
      if (!class_name.match(language)) {
        class_name += ' ' + language;
      }
      // See these 4 lines? This is IE's notion of "block.innerHTML = result". Love this browser :-/
      var container = document.createElement('div');
      container.innerHTML = '<pre><code class="' + class_name + '">' + result + '</code></pre>';
      var environment = block.parentNode.parentNode;
      environment.replaceChild(container.firstChild, block.parentNode);
    }
  }

  function langRe(language, value, global) {
    var mode =  'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '');
    return new RegExp(value, mode);
  }

  function compileModes() {
    for (var i in LANGUAGES) {
      if (!LANGUAGES.hasOwnProperty(i))
        continue;
      var language = LANGUAGES[i];
      for (var j = 0; j < language.modes.length; j++) {
        if (language.modes[j].begin)
          language.modes[j].beginRe = langRe(language, '^' + language.modes[j].begin);
        if (language.modes[j].end)
          language.modes[j].endRe = langRe(language, '^' + language.modes[j].end);
        if (language.modes[j].illegal)
          language.modes[j].illegalRe = langRe(language, '^(?:' + language.modes[j].illegal + ')');
        language.defaultMode.illegalRe = langRe(language, '^(?:' + language.defaultMode.illegal + ')');
        if (language.modes[j].relevance == undefined) {
          language.modes[j].relevance = 1;
        }
      }
    }
  }

  function compileKeywords() {

    function compileModeKeywords(mode) {
      if (!mode.keywordGroups) {
        for (var key in mode.keywords) {
          if (!mode.keywords.hasOwnProperty(key))
            continue;
          if (mode.keywords[key] instanceof Object)
            mode.keywordGroups = mode.keywords;
          else
            mode.keywordGroups = {'keyword': mode.keywords};
          break;
        }
      }
    }

    for (var i in LANGUAGES) {
      if (!LANGUAGES.hasOwnProperty(i))
        continue;
      var language = LANGUAGES[i];
      compileModeKeywords(language.defaultMode);
      for (var j = 0; j < language.modes.length; j++) {
        compileModeKeywords(language.modes[j]);
      }
    }
  }

  function findCode(pre) {
    for (var i = 0; i < pre.childNodes.length; i++) {
      node = pre.childNodes[i];
      if (node.nodeName == 'CODE')
        return node;
      if (!(node.nodeType == 3 && node.nodeValue.match(/\s+/)))
        return null;
    }
  }

  function initHighlighting() {
    if (initHighlighting.called)
      return;
    initHighlighting.called = true;
    compileModes();
    compileKeywords();
    if (arguments.length) {
      for (var i = 0; i < arguments.length; i++) {
        if (LANGUAGES[arguments[i]]) {
          selected_languages[arguments[i]] = LANGUAGES[arguments[i]];
        }
      }
    } else
      selected_languages = LANGUAGES;
    var pres = document.getElementsByTagName('pre');
    for (var i = 0; i < pres.length; i++) {
      var code = findCode(pres[i]);
      if (code)
        highlightBlock(code, hljs.tabReplace);
    }
  }

  function initHighlightingOnLoad() {
    var original_arguments = arguments;
    var handler = function(){initHighlighting.apply(null, original_arguments)};
    if (window.addEventListener) {
      window.addEventListener('DOMContentLoaded', handler, false);
      window.addEventListener('load', handler, false);
    } else if (window.attachEvent)
      window.attachEvent('onload', handler);
    else
      window.onload = handler;
  }

  this.LANGUAGES = LANGUAGES;
  this.highlight = highlight;
  this.initHighlightingOnLoad = initHighlightingOnLoad;
  this.highlightBlock = highlightBlock;
  this.initHighlighting = initHighlighting;

  // Common regexps
  this.IDENT_RE = '[a-zA-Z][a-zA-Z0-9_]*';
  this.UNDERSCORE_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*';
  this.NUMBER_RE = '\\b\\d+(\\.\\d+)?';
  this.C_NUMBER_RE = '\\b(0x[A-Za-z0-9]+|\\d+(\\.\\d+)?)';
  this.RE_STARTERS_RE = '!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|\\.|-|-=|/|/=|:|;|<|<<|<<=|<=|=|==|===|>|>=|>>|>>=|>>>|>>>=|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~';

  // Common modes
  this.APOS_STRING_MODE = {
    className: 'string',
    begin: '\'', end: '\'',
    illegal: '\\n',
    contains: ['escape'],
    relevance: 0
  };
  this.QUOTE_STRING_MODE = {
    className: 'string',
    begin: '"', end: '"',
    illegal: '\\n',
    contains: ['escape'],
    relevance: 0
  };
  this.BACKSLASH_ESCAPE = {
    className: 'escape',
    begin: '\\\\.', end: '^', noMarkup: true,
    relevance: 0
  };
  this.C_LINE_COMMENT_MODE = {
    className: 'comment',
    begin: '//', end: '$',
    relevance: 0
  };
  this.C_BLOCK_COMMENT_MODE = {
    className: 'comment',
    begin: '/\\*', end: '\\*/'
  };
  this.HASH_COMMENT_MODE = {
    className: 'comment',
    begin: '#', end: '$'
  };
  this.C_NUMBER_MODE = {
    className: 'number',
    begin: this.C_NUMBER_RE, end: '^',
    relevance: 0
  };
}();

var initHighlightingOnLoad = hljs.initHighlightingOnLoad;

/*
Language: SQL
*/

hljs.LANGUAGES.sql =
{
  case_insensitive: true,
  defaultMode:
  {
    lexems: [hljs.IDENT_RE],
    contains: ['string', 'number', 'comment'],
    keywords: {
      'keyword': {'all': 1, 'partial': 1, 'global': 1, 'month': 1, 'current_timestamp': 1, 'using': 1, 'go': 1, 'revoke': 1, 'smallint': 1, 'indicator': 1, 'end-exec': 1, 'disconnect': 1, 'zone': 1, 'with': 1, 'character': 1, 'assertion': 1, 'to': 1, 'add': 1, 'current_user': 1, 'usage': 1, 'input': 1, 'local': 1, 'alter': 1, 'match': 1, 'collate': 1, 'real': 1, 'then': 1, 'rollback': 1, 'get': 1, 'read': 1, 'timestamp': 1, 'session_user': 1, 'not': 1, 'integer': 1, 'bit': 1, 'unique': 1, 'day': 1, 'minute': 1, 'desc': 1, 'insert': 1, 'execute': 1, 'like': 1, 'ilike': 2, 'level': 1, 'decimal': 1, 'drop': 1, 'continue': 1, 'isolation': 1, 'found': 1, 'where': 1, 'constraints': 1, 'domain': 1, 'right': 1, 'national': 1, 'some': 1, 'module': 1, 'transaction': 1, 'relative': 1, 'second': 1, 'connect': 1, 'escape': 1, 'close': 1, 'system_user': 1, 'for': 1, 'deferred': 1, 'section': 1, 'cast': 1, 'current': 1, 'sqlstate': 1, 'allocate': 1, 'intersect': 1, 'deallocate': 1, 'numeric': 1, 'public': 1, 'preserve': 1, 'full': 1, 'goto': 1, 'initially': 1, 'asc': 1, 'no': 1, 'key': 1, 'output': 1, 'collation': 1, 'group': 1, 'by': 1, 'union': 1, 'session': 1, 'both': 1, 'last': 1, 'language': 1, 'constraint': 1, 'column': 1, 'of': 1, 'space': 1, 'foreign': 1, 'deferrable': 1, 'prior': 1, 'connection': 1, 'unknown': 1, 'action': 1, 'commit': 1, 'view': 1, 'or': 1, 'first': 1, 'into': 1, 'float': 1, 'year': 1, 'primary': 1, 'cascaded': 1, 'except': 1, 'restrict': 1, 'set': 1, 'references': 1, 'names': 1, 'table': 1, 'outer': 1, 'open': 1, 'select': 1, 'size': 1, 'are': 1, 'rows': 1, 'from': 1, 'prepare': 1, 'distinct': 1, 'leading': 1, 'create': 1, 'only': 1, 'next': 1, 'inner': 1, 'authorization': 1, 'schema': 1, 'corresponding': 1, 'option': 1, 'declare': 1, 'precision': 1, 'immediate': 1, 'else': 1, 'timezone_minute': 1, 'external': 1, 'varying': 1, 'translation': 1, 'true': 1, 'case': 1, 'exception': 1, 'join': 1, 'hour': 1, 'default': 1, 'double': 1, 'scroll': 1, 'value': 1, 'cursor': 1, 'descriptor': 1, 'values': 1, 'dec': 1, 'fetch': 1, 'procedure': 1, 'delete': 1, 'and': 1, 'false': 1, 'int': 1, 'is': 1, 'describe': 1, 'char': 1, 'as': 1, 'at': 1, 'in': 1, 'varchar': 1, 'null': 1, 'trailing': 1, 'any': 1, 'absolute': 1, 'current_time': 1, 'end': 1, 'grant': 1, 'privileges': 1, 'when': 1, 'cross': 1, 'check': 1, 'write': 1, 'current_date': 1, 'pad': 1, 'begin': 1, 'temporary': 1, 'exec': 1, 'time': 1, 'update': 1, 'catalog': 1, 'user': 1, 'sql': 1, 'date': 1, 'on': 1, 'identity': 1, 'timezone_hour': 1, 'natural': 1, 'whenever': 1, 'interval': 1, 'work': 1, 'order': 1, 'cascade': 1, 'diagnostics': 1, 'nchar': 1, 'having': 1, 'left': 1},
      'aggregate': {'count': 1, 'sum': 1, 'min': 1, 'max': 1, 'avg': 1}
    }
  },

  modes: [
    hljs.C_NUMBER_MODE,
    hljs.C_BLOCK_COMMENT_MODE,
    {
      className: 'comment',
      begin: '--', end: '$'
    },
    {
      className: 'string',
      begin: '\'', end: '\'',
      contains: ['escape', 'squote'],
      relevance: 0
    },
    {
      className: 'squote',
      begin: '\'\'', end: '^', noMarkup: true
    },
    {
      className: 'string',
      begin: '"', end: '"',
      contains: [ 'escape', 'dquote'],
      relevance: 0
    },
    {
      className: 'dquote',
      begin: '""', end: '^', noMarkup: true
    },
    {
      className: 'string',
      begin: '`', end: '`',
      contains: ['escape']
    },
    hljs.BACKSLASH_ESCAPE
  ]
};
