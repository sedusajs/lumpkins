@{%
  const lexer = require('./lexer')
  const emitter = require('./emitter')
  // const tpl = emitter.createTemplate();
  const {Interpolation} = emitter

  function handleUnary (operator, operand) {
    switch (operator) {
      case '-': return emitter.emitUnaryMinus(operand)
      case '+': return emitter.emitUnaryPlus(operand)
      case '!': return emitter.emitNegation(operand)
      case 'typeof': return emitter.emitGetType(operand)
    }
  }
%}

@lexer lexer

tempate ->
  interpolation %eof {% ([d]) => d.join() %}

interpolation ->
  null                                {% d => new Interpolation() %}
  | interpolation interpolation_item  {% ([interpolation, item]) => interpolation.add(item) %}

interpolation_item ->
  interpolation_text            {% ([d]) => Interpolation.text(d) %}
  | interpolation_tag           {% ([d]) => Interpolation.tag(d) %}
  | interpolation_expression    {% ([d]) => Interpolation.expression(d) %}


interpolation_text ->
  %text                       {% d => d[0].value %}
  | %escaped_backslash        {% d => "\\" %}
  | %escaped_lt               {% d => "<" %}
  | %escaped_expression_start {% d => "{" %}
  | %escaped_pipe             {% d => "|" %}

interpolation_tag ->
  %tag  {% ([d]) => emitter.emitTag(d.value, d) %}

interpolation_expression ->
  "{" _ rh_expression _ "}" {% d => d[2] %}
  | "{" _ "}"               {% () => `""`%}


# expression
rh_expression ->
  rh_coalescing   {% ([d]) => emitter.emitExpression(d) %}

lh_expression ->
  lh_coalescing   {% ([d]) => emitter.emitExpression(d) %}


# ternary
# rh_ternary ->
#   lh_null_coalescing _ "?" _ lh_ternary _ ":" _ rh_ternary {% d => d[0] ? d[4] : d[8] %}
#   | rh_null_coalescing                                           {% id %}

# lh_ternary ->
#   lh_null_coalescing _ "?" _ lh_ternary _ ":" _ lh_ternary {% d => d[0] ? d[4] : d[8] %}
#   | lh_null_coalescing                                           {% id %}


# coalescing
rh_coalescing ->
  lh_logical_or _ coalescing_op _ rh_coalescing {% d => d[0] ? d[0] : d[4] %}
  | rh_logical_or                               {% id %}

lh_coalescing ->
  lh_logical_or _ coalescing_op _ lh_coalescing {% d => d[0] ? d[0] : d[4] %}
  | lh_logical_or                               {% id %}

coalescing_op ->
  "??"
  | "???"


# logical or
rh_logical_or ->
  lh_logical_or __ "or" __ rh_logical_and {% d => d[0] || d[4] %}
  | rh_logical_and                      {% id %}

lh_logical_or ->
  lh_logical_or __ "or" __ lh_logical_and {% d => d[0] || d[4] %}
  | lh_logical_and                      {% id %}


# logical and
rh_logical_and ->
  lh_logical_and __ "and" __ rh_equality {% d => d[0] && d[4] %}
  | rh_equality                        {% id %}

lh_logical_and ->
  lh_logical_and __ "and" __ lh_equality {% d => d[0] && d[4] %}
  | lh_equality                        {% id %}


# equality
rh_equality ->
  lh_equality _ equality_op _ rh_relational {% d => d[0] == d[4] %}
  | rh_relational                           {% id %}

lh_equality ->
  lh_equality _ equality_op _ lh_relational {% d => d[0] == d[4] %}
  | lh_relational                           {% id %}

equality_op ->
  "=="
  | "==="
  | "!="
  | "!=="


# relational
rh_relational ->
  lh_relational _ relational_op _ rh_additive  {% (d) => d[0] < d[4] %}
  | rh_additive                                {% id %}

lh_relational ->
  lh_relational _ relational_op _ lh_additive  {% (d) => d[0] < d[4] %}
  | lh_additive                                {% id %}

relational_op ->
  "<"
  | "<="
  | ">"
  | ">="
  | "in"


# additive
rh_additive ->
  lh_additive _ additive_op _ rh_multiplicative  {% (d) => d[0] + d[4] %}
  | rh_multiplicative                            {% id %}

lh_additive ->
  lh_additive _ additive_op _ lh_multiplicative  {% (d) => d[0] + d[4] %}
  | lh_multiplicative                            {% id %}

additive_op ->
  "+"
  | "-"


# multiplicative
rh_multiplicative ->
  lh_multiplicative _ multiplicative_op _ rh_exponentative  {% (d) => `(${d[0]}) * ${d[4]}` %}
  | rh_exponentative                                        {% id %}

lh_multiplicative ->
  lh_multiplicative _ multiplicative_op _ lh_exponentative  {% (d) => `(${d[0]}) * ${d[4]}` %}
  | lh_exponentative                                        {% id %}

multiplicative_op ->
  "*"
  | "/"
  | "%"


# exponentative
rh_exponentative ->
  lh_exponentative _ "**" _ rh_unary  {% d => emitter.emitExponentative(d[0], d[4]) %}
  | rh_unary                          {% id %}

lh_exponentative ->
  lh_exponentative _ "**" _ lh_unary  {% d => emitter.emitExponentative(d[0], d[4]) %}
  | lh_unary                          {% id %}

# unary
rh_unary ->
  unary_op _ rh_unary {% ([[operator], , operand]) => handleUnary(operator.value, operand) %}
  | rh_member         {% id %}

lh_unary ->
  unary_op _ lh_unary {% ([[operator], , operand]) => handleUnary(operator.value, operand) %}
  | lh_member         {% id %}

unary_op ->
  "-"
  | "+"
  | "!"
  | "typeof"


# member
rh_member->
  member      {% id %}
  | rh_call {% id %}

lh_member->
  member      {% id %}
  | lh_call {% id %}

member ->
  lh_member _ "." _ member_spec               {% d => emitter.emitPropertyGet(d[0], d[4], true) %}
  | lh_member _ "?" "." _ member_spec         {% d => emitter.emitPropertyGet(d[0], d[5], false) %}
  | lh_member _ "[" _ rh_expression _ "]"     {% d => emitter.emitPropertyGetDynamic(d[0], d[4], true) %}
  | lh_member _ "?" "[" _ rh_expression _ "]" {% d => emitter.emitPropertyGetDynamic(d[0], d[5], false) %}

member_spec ->
  %identifier     {% ([d]) => d.value %}
  | keyword       {% ([[d]]) => d.value %}


# call
rh_call ->
  call
  | rh_parens

lh_call ->
  call
  | lh_parens

call ->
  lh_member _ arguments
  | lh_member _ "?" arguments

arguments ->
  "(" _ ")"
  | "(" _ argument_list _ ")"

argument_list ->
  argument
  | argument_list _ "," _ argument

argument ->
  rh_expression


# parens
rh_parens ->
  "(" _ rh_expression _ ")" {% d => emitter.emitExpression(d[2]) %}
  | flow                    {% id %}
  | value                   {% id %}

lh_parens ->
  "(" _ rh_expression _ ")" {% d => emitter.emitExpression(d[2]) %}
  | value                   {% id %}

flow ->
  "if" __ rh_expression __ "then" __ rh_expression __ "else" __ rh_expression {% d => emitter.emitConditional(d[2], d[6], d[10]) %}


value ->
  literal {% id %}
  | ident {% id %}

literal ->
  number                  {% id %}
  | string                {% id %}
  | bool                  {% id %}
  | null_literal          {% id %}
  | interpolation_literal {% id %}
  | void_literal          {% id %}

ident ->
  %identifier {% ([d]) => emitter.emitGlobalPropertyGet(d.value, d) %}

number ->
  %decimal_number {% ([d]) => emitter.emitDecimal(d.value, d) %}
  | "NaN"         {% () => emitter.emitNaN() %}
  | "Infinity"    {% () => emitter.emitInfinity() %}


string ->
  %double_quoted_string   {% ([s]) => emitter.emitString(s.value) %}
  | %single_quoted_string {% ([s]) => emitter.emitString(s.value) %}

bool ->
  "true"    {% () => emitter.emitTrue() %}
  | "false" {% () => emitter.emitFalse() %}

null_literal ->
  "null" {% () => emitter.emitNull() %}

interpolation_literal ->
  "|" interpolation "|" {% ([,d]) => d.join() %}

void_literal ->
  "(" _ ")"   {% () => emitter.emitVoid() %}

keyword ->
  "true"
  | "false"
  | "null"
  | "NaN"
  | "Infinity"
  | "if"
  | "then"
  | "else"
  | "this"
  | "typeof"
  | "in"
  | "and"
  | "or"

_ ->
  null | %space {% () => undefined %}

__ ->
  %space {% () => undefined %}