import { fetchData, storage, update, get, sort } from './controller.js'
import { modal, display, toggle, scroll } from './view.js'
import { elementObject, config, templateData } from './model.js'

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
    display.loadingSpin(elementObject.friendList)
    let friendList = storage.retrieve('friendList')

    if (!friendList) {
      friendList = await generateFriendList()
    }

    const sortedFriendList = pickOnlineAndSort(friendList, 30)
    const nickNameFlag = storage.retrieve('hakoConfig').displayNickname
    setTimeout(() => {
      display.friendList(sortedFriendList, elementObject.friendList, nickNameFlag)
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
      modal.ceremony(elementObject.ceremonyMessageContainer, todayString, username)
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
  },
  async registerSW () {
    if ('serviceWorker' in navigator) {
      await navigator.serviceWorker.register('../../sw.js', { scope: '/' })
    }
  }
}

export const show = {
  friendModal (id) {
    id = Number(id)
    modal.friendEmpty(elementObject.friendModal)
    const friends = storage.retrieve('friendList')
    const friend = friends.find(friend => friend.id === id)
    setTimeout(() => {
      const nickNameFlag = storage.retrieve('hakoConfig').displayNickname
      modal.friend(friend, elementObject.friendModal, nickNameFlag)
      addListener.friendModalChatIcon(id)
      addListener.friendModalNameEditIcon(id)
    }, 300)
  },
  friendReply (friendRepliesArray, allChatLog, nowChatWithId) {
    for (const index in friendRepliesArray) {
      setTimeout(() => {
        // prevent message display when switch to another friend
        const messageDisplayChatTo = Number(elementObject.messageDisplay.dataset.nowChatWith)
        if (messageDisplayChatTo === templateData.nowChatWith) {
          display.singleMessage(elementObject.messageDisplay, friendRepliesArray[index], true)
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
  if (id === templateData.nowChatWith) return

  // if not means a new chat target
  display.chatConsole()
  toggle.activeFriend(id)

  const friendList = storage.retrieve('friendList')
  const friendData = friendList.find(friend => friend.id === id)
  display.friendNameInChatConsole(document.querySelector('#friendNameDisplay'), friendData)

  const allChatLog = storage.retrieve('chatLog')
  const previousChatLogWithId = get.previousChatLog(id, allChatLog)
  display.allChatLog(elementObject.messageDisplay, previousChatLogWithId)
  scroll.bottom()

  templateData.nowChatWith = id
}

export function pinFriend (id) {
  id = Number(id)
  toggle.pinIcon(id)
  scroll.top()

  const friendList = storage.retrieve('friendList')
  update.pinStatus(friendList, id)

  const sortedFriendList = sort.byPinAndOnlineStatus(friendList)
  const nickNameFlag = storage.retrieve('hakoConfig').displayNickname
  display.friendList(sortedFriendList, elementObject.friendList, nickNameFlag)

  storage.update('friendList', sortedFriendList)
}

export async function sendChatMessage (event) {
  // shift + enter to send message
  if ((event.keyCode === 10 || event.keyCode === 13) && event.shiftKey) {
    // prevent line break in textarea
    event.preventDefault()

    const userInput = elementObject.messageInput.value.trim()
    if (userInput.length !== 0) {
      display.singleMessage(elementObject.messageDisplay, userInput)
      scroll.bottom()

      const nowChatWithId = templateData.nowChatWith
      const allChatLog = storage.retrieve('chatLog')
      storage.saveMessage(allChatLog, nowChatWithId, userInput)

      // clear message input textarea
      elementObject.messageInputFormResetBtn.click()

      // if friend online, auto reply
      const friendList = storage.retrieve('friendList')
      const friendData = friendList.find(friend => friend.id === nowChatWithId)
      if (friendData.online === true) {
        const friendRepliesArray = await get.friendReply()
        // mark auto reply message from which friend ID
        elementObject.messageDisplay.dataset.nowChatWith = nowChatWithId
        await show.friendReply(friendRepliesArray, allChatLog, nowChatWithId)
      }
    }
  }
}

async function generateFriendList () {
  const friends = await fetchData(config.friendListApi)
  // fetch background image's id
  const picsums100 = await fetchData(`${config.picsumApi}?page=3&limit=100`)
  const picsums200 = await fetchData(`${config.picsumApi}?page=4&limit=100`)
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
    const nowOnlineNumber = Math.floor(Math.random() * (config.maxOnlineNumber - config.minOnlineNumber)) + config.minOnlineNumber
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
      const nickNameFlag = storage.retrieve('hakoConfig').displayNickname
      const sortedFriendList = sort.byPinAndOnlineStatus(friendList)
      display.friendList(sortedFriendList, elementObject.friendList, nickNameFlag)
      document.querySelector('.modal .btn-close').click()
    })
  },
  settingPanelSaveBtn () {
    document.querySelector('#saveSettings').addEventListener('click', () => {
      const avatarFile = document.querySelector('#userAvatarFile').files[0]
      if (avatarFile) saveImgAsBase64(avatarFile)

      const username = document.querySelector('#username').value
      const ceremonyDate = document.querySelector('#ceremony').value
      const nickNameFlag = document.querySelector('#displayNickname').checked

      const config = storage.retrieve('hakoConfig')

      if (username.trim().length > 0) config.username = username
      if (ceremonyDate.length > 0) config.ceremonyDate = ceremonyDate
      if (config.displayNickname !== nickNameFlag) config.displayNickname = nickNameFlag
      storage.update('hakoConfig', config)

      const friendList = storage.retrieve('friendList')
      const displayNicknameFlag = storage.retrieve('hakoConfig').displayNickname

      const sortedFriendList = pickOnlineAndSort(friendList, 30)
      display.friendList(sortedFriendList, elementObject.friendList, displayNicknameFlag)

      document.querySelector('#closeSettingPanel').click()
    })
  },
  userModalEditBtn () {
    document.querySelector('#editUserInfo').addEventListener('click', () => {
      document.querySelector('#userAvatar .btn-close').click()
      elementObject.settingBtn.click()
    })
  }
}
