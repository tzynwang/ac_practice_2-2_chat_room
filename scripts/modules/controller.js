import * as model from './model.js'

export async function fetchData (url) {
  try {
    return await axios.get(url)
  } catch (error) {
    console.error(error)
  }
}

export const storage = {
  save (localStorageKey, data) {
    // setItem only once
    if (window.localStorage.getItem(localStorageKey) === null) {
      window.localStorage.setItem(localStorageKey, JSON.stringify(data))
    }
  },
  update (localStorageKey, data) {
    window.localStorage.setItem(localStorageKey, JSON.stringify(data))
  },
  retrieve (localStorageKey) {
    return JSON.parse(window.localStorage.getItem(localStorageKey))
  }
}

// export function saveToLocalStorage (localStorageKey, data) {
//   // setItem only once
//   if (window.localStorage.getItem(localStorageKey) === null) {
//     window.localStorage.setItem(localStorageKey, JSON.stringify(data))
//   }
// }

// export function updateLocalStorage (localStorageKey, data) {
//   window.localStorage.setItem(localStorageKey, JSON.stringify(data))
// }

// export function retrieveFromLocalStorage (localStorageKey) {
//   return JSON.parse(window.localStorage.getItem(localStorageKey))
// }

export function updateOnlineFriend (dataArray, onlineNumber) {
  // reset all current online friends
  dataArray.forEach(data => {
    data.online = false
  })

  for (let i = 0; i < onlineNumber; i++) {
    const randomPickIndex = Math.floor(Math.random() * dataArray.length)
    dataArray[randomPickIndex].online = true
  }
}

export function getPreviousChatLog (id, dataArray) {
  if (dataArray.some(data => data.id === id)) {
    const previousChatLogObject = dataArray.find(data => data.id === id)
    return previousChatLogObject.log
  }
  return []
}

export function saveMessageToLocalStorage (dataArrayToUpdate, nowChatWithId, message, friendMessage = false) {
  const chatBefore = dataArrayToUpdate.some(data => data.id === nowChatWithId)
  if (!chatBefore) dataArrayToUpdate.push({ id: nowChatWithId, log: [] })

  dataArrayToUpdate.forEach(data => {
    if (data.id === nowChatWithId) {
      friendMessage
        ? data.log.push({ speakId: nowChatWithId, log: message })
        : data.log.push({ speakId: -1, log: message })
    }
  })
  storage.update('chatLog', dataArrayToUpdate)
}

export function sortFriendListByPinAndOnlineStatus (dataArray) {
  const pinAndOnline = []
  const pin = []
  const online = []
  const rest = []

  dataArray.forEach(data => {
    if (data.pin && data.online) {
      pinAndOnline.push(data)
    } else if (data.pin && !data.online) {
      pin.push(data)
    } else if (data.online && !data.pin) {
      online.push(data)
    } else {
      rest.push(data)
    }
  })

  // sort rest array by id
  rest.sort(function (firstItem, secondItem) {
    const firstId = firstItem.id
    const secondId = secondItem.id
    return ((firstId < secondId) ? -1 : ((firstId > secondId) ? 1 : 0))
  })

  return [...pinAndOnline, ...pin, ...online, ...rest]
}

export function updatePinStatus (dataArray, id) {
  if (!dataArray.some(data => data.id === id)) return
  dataArray.forEach(data => {
    if (data.id === id) {
      data.pin ? data.pin = false : data.pin = true
    }
  })
}

export async function getFriendReply () {
  const actualFetchSentencesNumber = Math.floor(Math.random() * model.config.friendReplyNumber) + 1
  const replyText = await fetchData(`${model.config.replyMessageApi}${actualFetchSentencesNumber}`)

  const sentences = splitParagraphToSentences(replyText.data[0])
  const emoji = await getEmoji()

  const sentencesWithEmoji = addEmojiToSentences(sentences, emoji)
  return sentencesWithEmoji
}

function splitParagraphToSentences (paragraph) {
  const sentencesArray = paragraph.split('. ')
  const container = []
  sentencesArray.forEach((sentence, index) => {
    index < sentencesArray.length - 1
      ? container.push(`${sentence}.`)
      : container.push(sentence)
  })
  return container
}

async function getEmoji () {
  const emojiRaw = await fetchData(model.config.emojiApi)
  const filterEmojiBySubGroup = emojiRaw.data.filter(emoji => emoji.subGroup === 'face-smiling' || emoji.subGroup === 'face-affection')
  // this api will return 2-set same emoji, get first-half is enough
  return filterEmojiBySubGroup.slice(0, filterEmojiBySubGroup.length / 2)
}

function addEmojiToSentences (sentences, emoji) {
  const container = []
  sentences.forEach(sentence => {
    container.push(`${sentence} ${emoji[Math.floor(Math.random() * emoji.length)].character}`)
  })
  return container
}

export function updateNickName (id) {
  const newNickname = document.querySelector('#nicknameInput').value.trim()
  const friendList = storage.retrieve('friendList')

  friendList.forEach(friend => {
    if (friend.id === id) {
      newNickname.length <= 0
        ? friend.nickname = false
        : friend.nickname = newNickname
    }
  })
  storage.update('friendList', friendList)
}
