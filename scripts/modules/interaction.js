import { fetchData, storage, update, get, sort } from './controller.js'
import { modal, display, toggle, scroll } from './view.js'
import * as model from './model.js'

export const establish = {
  chatLog () {
    if (!storage.retrieve('chatLog')) {
      const chatLogContainer = []
      storage.save('chatLog', chatLogContainer)
    }
  },
  config () {
    if (!storage.retrieve('hakoConfig')) {
      const hakoConfig = { userAvatarBase64: '', username: '', ceremonyDate: '', displayNickname: true, hasDisplayCeremonyMessage: false }
      storage.save('hakoConfig', hakoConfig)
    }
  },
  async friendList () {
    display.loadingSpin(model.elementObject.friendList)
    let friendList = storage.retrieve('friendList')

    if (!friendList) {
      friendList = await generateFriendList()
    }

    const sortedFriendList = pickOnlineAndSort(friendList, 30)
    const displayNickname = storage.retrieve('hakoConfig').displayNickname
    setTimeout(() => {
      display.friendList(sortedFriendList, model.elementObject.friendList, displayNickname)
    }, 300)
  },
  ceremonyMessage () {
    const config = storage.retrieve('hakoConfig')
    if (!config) return

    const today = new Date()
    const ceremonyDate = config.ceremonyDate.substring(5) // get only MM-DD
    const todayForCheck = new Date().toISOString().substring(5, 10)

    if (ceremonyDate === todayForCheck && config.hasDisplayCeremonyMessage === false) {
      const todayString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      const username = config.username
      modal.ceremony(model.elementObject.ceremonyMessageContainer, todayString, username)
      document.querySelector('#ceremonyCard').click()

      config.hasDisplayCeremonyMessage = true
      storage.update('hakoConfig', config)
    }
  },
  initialSettings () {
    this.chatLog()
    this.config()
    this.friendList()
    this.ceremonyMessage()
  }
}

export const show = {
  friendModal (id) {
    id = Number(id)
    modal.friendEmpty(model.elementObject.friendModal)
    const friends = storage.retrieve('friendList')
    const friend = friends.find(friend => friend.id === id)
    setTimeout(() => {
      const displayNickname = storage.retrieve('hakoConfig').displayNickname
      modal.friend(friend, model.elementObject.friendModal, displayNickname)
      addListener.friendModalChatIcon(id)
      addListener.friendModalNameEditIcon(id)
    }, 300)
  },
  friendReply (friendRepliesArray, allChatLog, nowChatWithId) {
    for (const index in friendRepliesArray) {
      setTimeout(() => {
        // prevent message display when switch to another friend
        const messageDisplayChatTo = Number(model.elementObject.messageDisplay.dataset.nowChatWith)
        if (messageDisplayChatTo === model.templateData.nowChatWith) {
          display.singleMessage(model.elementObject.messageDisplay, friendRepliesArray[index], true)
        }

        storage.saveMessage(allChatLog, nowChatWithId, friendRepliesArray[index], true)
        scroll.bottom()
      }, (1000 * index) + Math.floor(Math.random() * 300))
    }
  },
  userModal () {
    updateContent.userModal()
    addListener.userModalEditBtn()
  },
  settingPanel () {
    updateContent.settingModal()
    addListener.settingPanelSaveBtn()
  }
}

export async function chatTo (id) {
  id = Number(id)
  if (id === model.templateData.nowChatWith) return

  // if not means a new chat target
  display.chatConsole()
  toggle.activeFriend(id)

  const friendList = storage.retrieve('friendList')
  const friendData = friendList.find(friend => friend.id === id)
  display.friendNameInChatConsole(document.querySelector('#friendNameDisplay'), friendData)

  const allChatLog = storage.retrieve('chatLog')
  const previousChatLogWithId = get.previousChatLog(id, allChatLog)
  display.allChatLog(model.elementObject.messageDisplay, previousChatLogWithId)
  scroll.bottom()

  model.templateData.nowChatWith = id
}

export function pinFriend (id) {
  id = Number(id)
  toggle.pinIcon(id)
  scroll.top()

  const friendList = storage.retrieve('friendList')
  update.pinStatus(friendList, id)

  const sortedFriendList = sort.byPinAndOnlineStatus(friendList)
  const displayNickname = storage.retrieve('hakoConfig').displayNickname
  display.friendList(sortedFriendList, model.elementObject.friendList, displayNickname)

  storage.update('friendList', sortedFriendList)
}

export async function sendChatMessage (event) {
  // shift + enter to send message
  if ((event.keyCode === 10 || event.keyCode === 13) && event.shiftKey) {
    // prevent line break in textarea
    event.preventDefault()

    const userInput = model.elementObject.messageInput.value.trim()
    if (userInput.length !== 0) {
      display.singleMessage(model.elementObject.messageDisplay, userInput)
      scroll.bottom()

      const nowChatWithId = model.templateData.nowChatWith
      const allChatLog = storage.retrieve('chatLog')
      storage.saveMessage(allChatLog, nowChatWithId, userInput)

      // clear message input textarea
      model.elementObject.messageInputFormResetBtn.click()

      // if friend online, auto reply
      const friendList = storage.retrieve('friendList')
      const friendData = friendList.find(friend => friend.id === nowChatWithId)
      if (friendData.online === true) {
        const friendRepliesArray = await get.friendReply()
        // mark auto reply message from which friend ID
        model.elementObject.messageDisplay.dataset.nowChatWith = nowChatWithId
        await show.friendReply(friendRepliesArray, allChatLog, nowChatWithId)
      }
    }
  }
}

async function generateFriendList () {
  const friends = await fetchData(model.config.friendListApi)
  // fetch background image's id
  const picsums100 = await fetchData(`${model.config.picsumApi}?page=3&limit=100`)
  const picsums200 = await fetchData(`${model.config.picsumApi}?page=4&limit=100`)
  const picsums = picsums100.data.concat(picsums200.data)
  friends.data.results.forEach(function (friend, index) {
    friend.backgroundImageId = Number(picsums[index].id)
  })
  storage.save('friendList', friends.data.results)
  return storage.retrieve('friendList')
}

function pickOnlineAndSort (friendList, minutes) {
  const currentTimeStamp = Date.now()
  const lastUpdateTimeStamp = storage.retrieve('lastOnlineUserUpdateTimeStamp')

  if (!lastUpdateTimeStamp || currentTimeStamp - lastUpdateTimeStamp > minutes * 60 * 1000) {
    const nowOnlineNumber = Math.floor(Math.random() * (model.config.maxOnlineNumber - model.config.minOnlineNumber)) + model.config.minOnlineNumber
    update.onlineFriend(friendList, nowOnlineNumber)
    storage.update('lastOnlineUserUpdateTimeStamp', currentTimeStamp)
    storage.update('friendList', friendList)
  }
  return sort.byPinAndOnlineStatus(friendList)
}

function saveImgAsBase64 (avatarFile) {
  const reader = new window.FileReader()
  reader.readAsDataURL(avatarFile)
  reader.onload = () => {
    const config = storage.retrieve('hakoConfig')
    config.userAvatarBase64 = reader.result
    storage.update('hakoConfig', config)
  }
}

const updateContent = {
  userModal () {
    const config = storage.retrieve('hakoConfig')
    modal.userAvatar(document.querySelector('#userPersonalPanel'), config)
  },
  settingModal () {
    const config = storage.retrieve('hakoConfig')
    modal.setting(document.querySelector('#personalSettingsPanel'), config)
  }
}

const addListener = {
  friendModalChatIcon (id) {
    document.querySelector('.hako-chat-icon i').addEventListener('click', event => {
      if (event.target.dataset.id) {
        document.querySelector('.modal .btn-close').click()
        chatTo(Number(id))
      }
    })
  },
  friendModalNameEditIcon (id) {
    document.querySelector(`[data-edit-name="${id}"]`).addEventListener('click', event => {
      if (event.target.dataset.editName) {
        const editIcon = event.target
        display.nameEditInput(editIcon, Number(id))
        addListener.friendModalConfirmEdit(id)
      }
    })
  },
  friendModalConfirmEdit (id) {
    document.querySelector(`[data-confirm-edit="${id}"]`).addEventListener('click', () => {
      update.nickName(id)
      const friendList = storage.retrieve('friendList')
      const displayNickname = storage.retrieve('hakoConfig').displayNickname
      const sortedFriendList = sort.byPinAndOnlineStatus(friendList)
      display.friendList(sortedFriendList, model.elementObject.friendList, displayNickname)
      document.querySelector('.modal .btn-close').click()
    })
  },
  settingPanelSaveBtn () {
    document.querySelector('#saveSettings').addEventListener('click', () => {
      const avatarFile = document.querySelector('#userAvatarFile').files[0]
      if (avatarFile) saveImgAsBase64(avatarFile)

      const username = document.querySelector('#username').value
      const ceremonyDate = document.querySelector('#ceremony').value
      const displayNickname = document.querySelector('#displayNickname').checked

      const config = storage.retrieve('hakoConfig')

      if (username.trim().length > 0) config.username = username
      if (ceremonyDate.length > 0) config.ceremonyDate = ceremonyDate
      if (config.displayNickname !== displayNickname) config.displayNickname = displayNickname
      storage.update('hakoConfig', config)

      const friendList = storage.retrieve('friendList')
      const displayNicknameFlag = storage.retrieve('hakoConfig').displayNickname

      const sortedFriendList = pickOnlineAndSort(friendList, 30)
      display.friendList(sortedFriendList, model.elementObject.friendList, displayNicknameFlag)

      document.querySelector('#closeSettingPanel').click()
    })
  },
  userModalEditBtn () {
    document.querySelector('#editUserInfo').addEventListener('click', () => {
      document.querySelector('#userAvatar .btn-close').click()
      model.elementObject.settingBtn.click()
    })
  }
}

// function addEventListenerToSaveSettingBtn () {
//   document.querySelector('#saveSettings').addEventListener('click', () => {
//     const avatarFile = document.querySelector('#userAvatarFile').files[0]
//     if (avatarFile) saveImgToLocalStorageAsBase64(avatarFile)

//     const username = document.querySelector('#username').value
//     const ceremonyDate = document.querySelector('#ceremony').value
//     const displayNickname = document.querySelector('#displayNickname').checked

//     const config = storage.retrieve('hakoConfig')

//     if (username.trim().length > 0) config.username = username
//     if (ceremonyDate.length > 0) config.ceremonyDate = ceremonyDate
//     if (config.displayNickname !== displayNickname) config.displayNickname = displayNickname
//     storage.update('hakoConfig', config)

//     const friendList = storage.retrieve('friendList')
//     const displayNicknameFlag = storage.retrieve('hakoConfig').displayNickname

//     const sortedFriendList = rePickOnlineFriends(friendList, 30)
//     display.friendList(sortedFriendList, model.elementObject.friendList, displayNicknameFlag)

//     document.querySelector('#closeSettingPanel').click()
//   })
// }

// export function setUserAvatarModal () {
//   displayUserAvatarModal()
//   addEventListenerToUserAvatarModalEditBtn()
// }

// function displayUserAvatarModal () {
//   const config = storage.retrieve('hakoConfig')
//   modal.userAvatar(document.querySelector('#userPersonalPanel'), config)
// }

// function addEventListenerToUserAvatarModalEditBtn () {
//   document.querySelector('#editUserInfo').addEventListener('click', () => {
//     document.querySelector('#userAvatar .btn-close').click()
//     model.elementObject.settingBtn.click()
//   })
// }

// function addEventListenerToFriendModalChatIcon (id) {
//   document.querySelector('.hako-chat-icon i').addEventListener('click', event => {
//     if (event.target.dataset.id) {
//       document.querySelector('.modal .btn-close').click()
//       chatTo(Number(id))
//     }
//   })
// }

// function addEventListenerToFriendModalNameEditIcon (id) {
//   document.querySelector(`[data-edit-name="${id}"]`).addEventListener('click', event => {
//     if (event.target.dataset.editName) {
//       const editIcon = event.target
//       display.nameEditInput(editIcon, Number(id))
//       addEventListenerToConfirmEdit(id)
//     }
//   })
// }

// function addEventListenerToConfirmEdit (id) {
//   document.querySelector(`[data-confirm-edit="${id}"]`).addEventListener('click', () => {
//     update.nickName(id)
//     const friendList = storage.retrieve('friendList')
//     const displayNickname = storage.retrieve('hakoConfig').displayNickname
//     const sortedFriendList = sort.byPinAndOnlineStatus(friendList)
//     display.friendList(sortedFriendList, model.elementObject.friendList, displayNickname)
//     document.querySelector('.modal .btn-close').click()
//   })
// }

// export function setSettingModal () {
//   displaySettingModalByConfig()
//   addEventListenerToSaveSettingBtn()
// }

// function displaySettingModalByConfig () {
//   const config = storage.retrieve('hakoConfig')
//   modal.setting(document.querySelector('#personalSettingsPanel'), config)
// }

// async function displayFriendChat (friendRepliesArray, allChatLog, nowChatWithId) {
//   for (const index in friendRepliesArray) {
//     setTimeout(() => {
//       // prevent message display when switch to another friend
//       const messageDisplayChatTo = Number(model.elementObject.messageDisplay.dataset.nowChatWith)
//       if (messageDisplayChatTo === model.templateData.nowChatWith) {
//         display.singleMessage(model.elementObject.messageDisplay, friendRepliesArray[index], true)
//       }

//       storage.saveMessage(allChatLog, nowChatWithId, friendRepliesArray[index], true)
//       scroll.bottom()
//     }, (1000 * index) + Math.floor(Math.random() * 300))
//   }
// }

// export function establishChatLogInLocalStorage () {
//   if (!storage.retrieve('chatLog')) {
//     const chatLogContainer = []
//     storage.save('chatLog', chatLogContainer)
//   }
// }

// export function establishConfigInLocalStorage () {
//   if (!storage.retrieve('hakoConfig')) {
//     const hakoConfig = { userAvatarBase64: '', username: '', ceremonyDate: '', displayNickname: true, hasDisplayCeremonyMessage: false }
//     storage.save('hakoConfig', hakoConfig)
//   }
// }

// export function checkIfCeremonyDate () {
//   const config = storage.retrieve('hakoConfig')
//   if (!config) return

//   const today = new Date()
//   const ceremonyDate = config.ceremonyDate.substring(5) // get only MM-DD
//   const todayForCheck = new Date().toISOString().substring(5, 10)

//   if (ceremonyDate === todayForCheck && config.hasDisplayCeremonyMessage === false) {
//     const todayString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
//     const username = config.username
//     modal.ceremony(model.elementObject.ceremonyMessageContainer, todayString, username)
//     document.querySelector('#ceremonyCard').click()

//     config.hasDisplayCeremonyMessage = true
//     storage.update('hakoConfig', config)
//   }
// }

// export async function displayPersonalInfoModal (id) {
//   id = Number(id)
//   modal.friendEmpty(model.elementObject.friendModal)
//   const friends = storage.retrieve('friendList')
//   const friend = friends.find(friend => friend.id === id)
//   setTimeout(() => {
//     const displayNickname = storage.retrieve('hakoConfig').displayNickname
//     modal.friend(friend, model.elementObject.friendModal, displayNickname)
//     addEventListenerToFriendModalChatIcon(id)
//     addEventListenerToFriendModalNameEditIcon(id)
//   }, 300)
// }

// export async function loadFriendList () {
//   display.loadingSpin(model.elementObject.friendList)
//   let friendList = storage.retrieve('friendList')

//   if (!friendList) {
//     friendList = await generateFriendList()
//   }

//   const sortedFriendList = rePickOnlineFriends(friendList, 30)
//   const displayNickname = storage.retrieve('hakoConfig').displayNickname
//   setTimeout(() => {
//     display.friendList(sortedFriendList, model.elementObject.friendList, displayNickname)
//   }, 300)
// }
