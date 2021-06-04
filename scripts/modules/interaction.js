import * as controller from './controller.js'
import * as view from './view.js'
import * as model from './model.js'

export async function loadFriendList () {
  view.displayLoadingSpin(model.elementObject.friendList)
  let friendList = controller.retrieveFromLocalStorage('friendList')

  if (!friendList) {
    const friends = await controller.fetchData(model.config.friendListApi)
    // fetch background image's id
    const picsums100 = await controller.fetchData(`${model.config.picsumApi}?page=1&limit=100`)
    const picsums200 = await controller.fetchData(`${model.config.picsumApi}?page=1&limit=200`)
    const picsums = picsums100.data.concat(picsums200.data)
    friends.data.results.forEach(function (friend, index) {
      friend.backgroundImageId = Number(picsums[index].id)
    })
    controller.saveToLocalStorage('friendList', friends.data.results)
    friendList = controller.retrieveFromLocalStorage('friendList')
  }

  const currentTimeStamp = Date.now()
  const lastUpdateTimeStamp = controller.retrieveFromLocalStorage('lastOnlineUserUpdateTimeStamp')
  // re-pick online friends when last loading time is 10 minutes before
  if (!lastUpdateTimeStamp || currentTimeStamp - lastUpdateTimeStamp > 600000) {
    const nowOnlineNumber = Math.floor(Math.random() * (model.config.maxOnlineNumber - model.config.minOnlineNumber)) + model.config.minOnlineNumber
    controller.updateOnlineFriend(friendList, nowOnlineNumber)
    controller.updateLocalStorage('lastOnlineUserUpdateTimeStamp', currentTimeStamp)
    controller.updateLocalStorage('friendList', friendList)
  }

  const sortedFriendList = controller.sortFriendListByPinAndOnlineStatus(friendList)
  const displayNickname = controller.retrieveFromLocalStorage('hakoConfig').displayNickname
  setTimeout(() => {
    view.displayFriendList(sortedFriendList, model.elementObject.friendList, displayNickname)
  }, 300)
}

export function establishChatLogInLocalStorage () {
  if (!controller.retrieveFromLocalStorage('chatLog')) {
    const chatLogContainer = []
    controller.saveToLocalStorage('chatLog', chatLogContainer)
  }
}

export function establishConfigInLocalStorage () {
  if (!controller.retrieveFromLocalStorage('hakoConfig')) {
    const hakoConfig = { username: '', ceremonyDate: '', displayNickname: true, hasDisplayCeremonyMessage: false }
    controller.saveToLocalStorage('hakoConfig', hakoConfig)
  }
}

export function checkIfCeremonyDate () {
  const config = controller.retrieveFromLocalStorage('hakoConfig')
  if (!config) return

  const today = new Date()
  const ceremonyDate = config.ceremonyDate.substring(5) // get only MM-DD
  const todayForCheck = new Date().toISOString().substring(5, 10)

  if (ceremonyDate === todayForCheck && config.hasDisplayCeremonyMessage === false) {
    const todayString = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    view.displayCeremonyModal(model.elementObject.ceremonyMessageContainer, todayString)
    document.querySelector('#ceremonyCard').click()

    config.hasDisplayCeremonyMessage = true
    controller.updateLocalStorage('hakoConfig', config)
  }
}

export async function displayPersonalInfoModal (id) {
  id = Number(id)
  view.displayEmptyFriendModal(model.elementObject.friendModal)
  const friends = controller.retrieveFromLocalStorage('friendList')
  const friend = friends.find(friend => friend.id === id)
  setTimeout(() => {
    const displayNickname = controller.retrieveFromLocalStorage('hakoConfig').displayNickname
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
      console.log(Number(event.target.dataset.editName)) // test
      view.displayNameEditInput(editIcon, Number(id))
      addEventListenerToConfirmEdit(id)
    }
  })
}

function addEventListenerToConfirmEdit (id) {
  document.querySelector(`[data-confirm-edit="${id}"]`).addEventListener('click', () => {
    controller.updateNickName(id)
    const friendList = controller.retrieveFromLocalStorage('friendList')
    const displayNickname = controller.retrieveFromLocalStorage('hakoConfig').displayNickname
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

  const friendList = controller.retrieveFromLocalStorage('friendList')
  const friendData = friendList.find(friend => friend.id === id)
  view.updateFriendNameInChatArea(document.querySelector('#friendNameDisplay'), friendData)

  const allChatLog = controller.retrieveFromLocalStorage('chatLog')
  const previousChatLogWithId = controller.getPreviousChatLog(id, allChatLog)
  view.displayChatLogOnScreen(model.elementObject.messageDisplay, previousChatLogWithId)
  view.scrollToBottom()

  model.templateData.nowChatWith = id
}

async function displayFriendChat (friendRepliesArray, allChatLog, nowChatWithId) {
  for (const index in friendRepliesArray) {
    setTimeout(() => {
      view.addOneMessageOnScreen(model.elementObject.messageDisplay, friendRepliesArray[index], true)
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
      const allChatLog = controller.retrieveFromLocalStorage('chatLog')
      controller.saveMessageToLocalStorage(allChatLog, nowChatWithId, userInput)

      // clear message input textarea
      model.elementObject.messageInputFormResetBtn.click()

      // if friend online, auto reply
      const friendList = controller.retrieveFromLocalStorage('friendList')
      const friendData = friendList.find(friend => friend.id === nowChatWithId)
      if (friendData.online === true) {
        const friendRepliesArray = await controller.getFriendReply(model.config.friendReplyNumber)
        await displayFriendChat(friendRepliesArray, allChatLog, nowChatWithId)
      }
    }
  }
}

export function pinFriend (id) {
  id = Number(id)
  view.togglePinIcon(id)
  view.scrollToTop(model.elementObject.friendList)

  const friendList = controller.retrieveFromLocalStorage('friendList')
  controller.updatePinStatus(friendList, id)

  const sortedFriendList = controller.sortFriendListByPinAndOnlineStatus(friendList)
  const displayNickname = controller.retrieveFromLocalStorage('hakoConfig').displayNickname
  view.displayFriendList(sortedFriendList, model.elementObject.friendList, displayNickname)

  controller.updateLocalStorage('friendList', sortedFriendList)
}

export function displaySettingModalByConfig () {
  const config = controller.retrieveFromLocalStorage('hakoConfig')
  view.updateSettingModal(document.querySelector('#personalSettingsPanel'), config)
}

export function addEventListenerToSaveSettingBtn () {
  document.querySelector('#saveSettings').addEventListener('click', () => {
    const username = document.querySelector('#username').value
    const ceremonyDate = document.querySelector('#ceremony').value
    const displayNickname = document.querySelector('#displayNickname').checked
    const config = controller.retrieveFromLocalStorage('hakoConfig')

    if (username.trim().length > 0) config.username = username
    if (ceremonyDate.length > 0) config.ceremonyDate = ceremonyDate
    if (config.displayNickname !== displayNickname) config.displayNickname = displayNickname
    controller.updateLocalStorage('hakoConfig', config)

    const friendList = controller.retrieveFromLocalStorage('friendList')
    const displayNicknameFlag = controller.retrieveFromLocalStorage('hakoConfig').displayNickname
    view.displayFriendList(friendList, model.elementObject.friendList, displayNicknameFlag)

    document.querySelector('#closeSettingPanel').click()
  })
}
