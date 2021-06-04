export function isEmptyString (str) {
  try {
    const input = convertToString(str)
    return input.trim().length === 0
  } catch (error) {
    throw Error(error)
  }
}

function convertToString (input) {
  const inputType = typeof (input)
  switch (inputType) {
    case 'number':
      return input.toString(10)
    case 'string':
      return input
    case 'undefined':
      throw Error('Input can not be empty')
    default:
      throw Error('Input neither String or Number')
  }
}
