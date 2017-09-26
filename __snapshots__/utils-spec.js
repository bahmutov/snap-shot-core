exports['compare has error (snapshot) 1'] = {
  "@@type": "folktale:Result",
  "@@tag": "Error",
  "@@value": {
    "value": "\"foo\" !== \"bar\""
  }
}

exports['compare snapshots error value 1'] = "\"foo\" !== \"bar\""

exports['removeExtraNewLines leaves other values unchanged 1'] = {
  "foo": "bar",
  "age": 42
}

exports['removeExtraNewLines removes new lines 1'] = {
  "foo": "bar",
  "age": 42
}

