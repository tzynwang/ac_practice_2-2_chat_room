import * as controller from './controller.js'
import * as view from './view.js'
import * as model from './model.js'

export async function loadFriendList () {
  view.displayLoadingSpin(model.elementObject.friendList)
  let friendList = controller.storage.retrieve('friendList')

  if (!friendList) {
    friendList = await generateFriendList()
  }

  const sortedFriendList = rePickOnlineFriends(friendList, 30)
  const displayNickname = controller.storage.retrieve('hakoConfig').displayNickname
  setTimeout(() => {
    view.displayFriendList(sortedFriendList, model.elementObject.friendList, displayNickname)
  }, 300)
}

async function generateFriendList () {
  const friends = await controller.fetchData(model.config.friendListApi)
  // fetch background image's id
  const picsums100 = await controller.fetchData(`${model.config.picsumApi}?page=3&limit=100`)
  const picsums200 = await controller.fetchData(`${model.config.picsumApi}?page=4&limit=100`)
  const picsums = picsums100.data.concat(picsums200.data)
  friends.data.results.forEach(function (friend, index) {
    friend.backgroundImageId = Number(picsums[index].id)
  })
  controller.storage.save('friendList', friends.data.results)
  return controller.storage.retrieve('friendList')
}

function rePickOnlineFriends (friendList, minutes) {
  const currentTimeStamp = Date.now()
  const lastUpdateTimeStamp = controller.storage.retrieve('lastOnlineUserUpdateTimeStamp')

  if (!lastUpdateTimeStamp || currentTimeStamp - lastUpdateTimeStamp > minutes * 60 * 1000) {
    const nowOnlineNumber = Math.floor(Math.random() * (model.config.maxOnlineNumber - model.config.minOnlineNumber)) + model.config.minOnlineNumber
    controller.updateOnlineFriend(friendList, nowOnlineNumber)
    controller.storage.update('lastOnlineUserUpdateTimeStamp', currentTimeStamp)
    controller.storage.update('friendList', friendList)
  }
  return controller.sortFriendListByPinAndOnlineStatus(friendList)
}

export function establishChatLogInLocalStorage () {
  if (!controller.storage.retrieve('chatLog')) {
    const chatLogContainer = []
    controller.storage.save('chatLog', chatLogContainer)
  }
}

export function establishConfigInLocalStorage () {
  if (!controller.storage.retrieve('hakoConfig')) {
    const hakoConfig = { userAvatarBase64: '', username: '', ceremonyDate: '', displayNickname: true, hasDisplayCeremonyMessage: false }
    controller.storage.save('hakoConfig', hakoConfig)
  }
}

export function checkIfCeremonyDate () {
  const config = controller.storage.retrieve('hakoConfig')
  if (!config) return

  const today = new Date()
  const ceremonyDate = config.ceremonyDate.substring(5) // get only MM-DD
  const todayForCheck = new Date().toISOString().substring(5, 10)

  if (ceremonyDate === todayForCheck && config.hasDisplayCeremonyMessage === false) {
    const todayString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    const username = config.username
    view.displayCeremonyModal(model.elementObject.ceremonyMessageContainer, todayString, username)
    document.querySelector('#ceremonyCard').click()

    config.hasDisplayCeremonyMessage = true
    controller.storage.update('hakoConfig', config)
  }
}

export async function displayPersonalInfoModal (id) {
  id = Number(id)
  view.displayEmptyFriendModal(model.elementObject.friendModal)
  const friends = controller.storage.retrieve('friendList')
  const friend = friends.find(friend => friend.id === id)
  setTimeout(() => {
    const displayNickname = controller.storage.retrieve('hakoConfig').displayNickname
    view.displayFriendModal(friend, model.elementObject.friendModal, displayNickname)
    addEventListenerToFriendModalChatIcon(id)
    addEventListenerToFriendModalNameEditIcon(id)
  }, 300)
}

function addEventListenerToFriendModalChatIcon (id) {
  document.querySelector('.hako-chat-icon i').addEventListener('click', event => {
    if (event.target.dataset.id) {
      document.querySelector('.modal .btn-close').click()
      chatTo(Number(id))
    }
  })
}

function addEventListenerToFriendModalNameEditIcon (id) {
  document.querySelector(`[data-edit-name="${id}"]`).addEventListener('click', event => {
    if (event.target.dataset.editName) {
      const editIcon = event.target
      view.displayNameEditInput(editIcon, Number(id))
      addEventListenerToConfirmEdit(id)
    }
  })
}

function addEventListenerToConfirmEdit (id) {
  document.querySelector(`[data-confirm-edit="${id}"]`).addEventListener('click', () => {
    controller.updateNickName(id)
    const friendList = controller.storage.retrieve('friendList')
    const displayNickname = controller.storage.retrieve('hakoConfig').displayNickname
    view.displayFriendList(friendList, model.elementObject.friendList, displayNickname)
    document.querySelector('.modal .btn-close').click()
  })
}

export async function chatTo (id) {
  id = Number(id)
  if (id === model.templateData.nowChatWith) return

  // if not means a new chat target
  view.displayChatConsole()
  view.toggleActiveClassForClickedFriend(id)

  const friendList = controller.storage.retrieve('friendList')
  const friendData = friendList.find(friend => friend.id === id)
  view.updateFriendNameInChatArea(document.querySelector('#friendNameDisplay'), friendData)

  const allChatLog = controller.storage.retrieve('chatLog')
  const previousChatLogWithId = controller.getPreviousChatLog(id, allChatLog)
  view.displayChatLogOnScreen(model.elementObject.messageDisplay, previousChatLogWithId)
  view.scrollToBottom()

  model.templateData.nowChatWith = id
}

async function displayFriendChat (friendRepliesArray, allChatLog, nowChatWithId) {
  for (const index in friendRepliesArray) {
    setTimeout(() => {
      // prevent message display when switch to another friend
      const messageDisplayChatTo = Number(model.elementObject.messageDisplay.dataset.nowChatWith)
      if (messageDisplayChatTo === model.templateData.nowChatWith) {
        view.addOneMessageOnScreen(model.elementObject.messageDisplay, friendRepliesArray[index], true)
      }

      controller.saveMessageToLocalStorage(allChatLog, nowChatWithId, friendRepliesArray[index], true)
      view.scrollToBottom()
    }, (1000 * index) + Math.floor(Math.random() * 300))
  }
}

export async function sendChatMessage (event) {
  // shift + enter to send message
  if ((event.keyCode === 10 || event.keyCode === 13) && event.shiftKey) {
    // prevent line break in textarea
    event.preventDefault()

    const userInput = model.elementObject.messageInput.value.trim()
    if (userInput.length !== 0) {
      view.addOneMessageOnScreen(model.elementObject.messageDisplay, userInput)
      view.scrollToBottom()

      const nowChatWithId = model.templateData.nowChatWith
      const allChatLog = controller.storage.retrieve('chatLog')
      controller.saveMessageToLocalStorage(allChatLog, nowChatWithId, userInput)

      // clear message input textarea
      model.elementObject.messageInputFormResetBtn.click()

      // if friend online, auto reply
      const friendList = controller.storage.retrieve('friendList')
      const friendData = friendList.find(friend => friend.id === nowChatWithId)
      if (friendData.online === true) {
        const friendRepliesArray = await controller.getFriendReply()
        // mark auto reply message from which friend ID
        model.elementObject.messageDisplay.dataset.nowChatWith = nowChatWithId
        await displayFriendChat(friendRepliesArray, allChatLog, nowChatWithId)
      }
    }
  }
}

export function pinFriend (id) {
  id = Number(id)
  view.togglePinIcon(id)
  view.scrollToTop()

  const friendList = controller.storage.retrieve('friendList')
  controller.updatePinStatus(friendList, id)

  const sortedFriendList = controller.sortFriendListByPinAndOnlineStatus(friendList)
  const displayNickname = controller.storage.retrieve('hakoConfig').displayNickname
  view.displayFriendList(sortedFriendList, model.elementObject.friendList, displayNickname)

  controller.storage.update('friendList', sortedFriendList)
}

export function setSettingModal () {
  displaySettingModalByConfig()
  addEventListenerToSaveSettingBtn()
}

function displaySettingModalByConfig () {
  const config = controller.storage.retrieve('hakoConfig')
  view.updateSettingModal(document.querySelector('#personalSettingsPanel'), config)
}

function saveImgToLocalStorageAsBase64 (avatarFile) {
  const reader = new window.FileReader()
  reader.readAsDataURL(avatarFile)
  reader.onload = () => {
    const config = controller.storage.retrieve('hakoConfig')
    config.userAvatarBase64 = reader.result
    controller.storage.update('hakoConfig', config)
  }
}

function addEventListenerToSaveSettingBtn () {
  document.querySelector('#saveSettings').addEventListener('click', () => {
    const avatarFile = document.querySelector('#userAvatarFile').files[0]
    if (avatarFile) saveImgToLocalStorageAsBase64(avatarFile)

    const username = document.querySelector('#username').value
    const ceremonyDate = document.querySelector('#ceremony').value
    const displayNickname = document.querySelector('#displayNickname').checked

    const config = controller.storage.retrieve('hakoConfig')

    if (username.trim().length > 0) config.username = username
    if (ceremonyDate.length > 0) config.ceremonyDate = ceremonyDate
    if (config.displayNickname !== displayNickname) config.displayNickname = displayNickname
    controller.storage.update('hakoConfig', config)

    const friendList = controller.storage.retrieve('friendList')
    const displayNicknameFlag = controller.storage.retrieve('hakoConfig').displayNickname

    const sortedFriendList = rePickOnlineFriends(friendList, 30)
    view.displayFriendList(sortedFriendList, model.elementObject.friendList, displayNicknameFlag)

    document.querySelector('#closeSettingPanel').click()
  })
}

export function setUserAvatarModal () {
  displayUserAvatarModal()
  addEventListenerToUserAvatarModalEditBtn()
}

function displayUserAvatarModal () {
  const config = controller.storage.retrieve('hakoConfig')
  view.displayUserAvatarModal(document.querySelector('#userPersonalPanel'), config)
}

function addEventListenerToUserAvatarModalEditBtn () {
  document.querySelector('#editUserInfo').addEventListener('click', () => {
    document.querySelector('#userAvatar .btn-close').click()
    model.elementObject.settingBtn.click()
  })
}
