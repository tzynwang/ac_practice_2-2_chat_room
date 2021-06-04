import * as model from './model.js'

export function displayCeremonyModal (target, todayString, username) {
  target.innerHTML = ''

  let message
  username
    ? message = `Hi ${username}! Today is ${todayString}, it's your special day!`
    : message = `Today is ${todayString}, you've said this is a spacial day!`

  target.innerHTML = `
    <button type="button" id="ceremonyCard" class="visually-hidden" data-bs-toggle="modal" data-bs-target="#staticBackdrop"></button>

    <div class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body d-flex flex-column align-items-center">
            <img src="../../images/undraw_Appreciation_re_p6rl.svg" alt="ceremony image" class="mb-3">
            <p>${message}</p>
          </div>
        </div>
      </div>
    </div>
    `
}

export function displayLoadingSpin (target) {
  target.innerHTML = `
  <div class="d-flex flex-column justify-content-center align-items-center mt-5">
    <div class="spinner-border" role="status">
      <span class="visually-hidden"></span>
    </div>
    <span>Connecting...</span>
  </div>`
}

export function displayFriendList (dataArray, target, displayNickname) {
  target.innerHTML = ''
  dataArray.forEach(data => {
    let onlineStatusClass
    data.online === true ? onlineStatusClass = 'bi-brightness-high-fill hako-online' : onlineStatusClass = 'bi-cloud-moon-fill hako-offline'

    let pinIconClass
    data.pin === true ? pinIconClass = 'bi-pin-fill' : pinIconClass = 'bi-pin'

    let displayName
    displayNickname ? displayName = data.nickname || `${data.name} ${data.surname}` : displayName = `${data.name} ${data.surname}`

    target.insertAdjacentHTML('beforeend', `
    <li class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" data-chat="${data.id}">
      <i class="bi ${onlineStatusClass} d-inline-block"></i>
      <img src="${data.avatar}" alt="avatar" class="rounded-circle hako-avatar" data-id="${data.id}" data-bs-toggle="modal" data-bs-target="#friendModal">
      <span class="hako-name" data-chat="${data.id}">${displayName}</span>
      <i class="bi ${pinIconClass}" data-pin="${data.id}"></i>
    </li>
    `)
  })
}

export function displayEmptyFriendModal (target) {
  target.innerHTML = `
  <div class="modal-dialog modal-sm modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-body">
        <div class="d-flex flex-column justify-content-center align-items-center mt-5">
          <div class="spinner-border" role="status">
            <span class="visually-hidden"></span>
          </div>
          <span>Loading...</span>
        </div>
      </div>
    </div>
  </div>`
}

export function displayFriendModal (dataArray, target, displayNickname) {
  let displayName
  displayNickname ? displayName = dataArray.nickname || `${dataArray.name} ${dataArray.surname}` : displayName = `${dataArray.name} ${dataArray.surname}`
  target.innerHTML = `
  <div class="modal-dialog modal-sm">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="btn-close btn-sm" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body d-flex flex-column align-items-center">
        <div class="hako-modal-background">
          <img src="https://picsum.photos/id/${dataArray.backgroundImageId}/600">
        </div>
        <img src="${dataArray.avatar}" alt="avatar" class="rounded-circle mb-2 hako-modal-avatar">
        <div class="d-flex align-items-center hako-modal-name">
          <span>${displayName}</span>
          <i class="bi bi-pencil-square ms-2" data-edit-name="${dataArray.id}"></i>
        </div>
        <div class="mt-2 hako-chat-icon">
          <i class="bi bi-chat-dots-fill fs-3 mx-1" data-id=${dataArray.id}></i>
        </div>
      </div>
    </div>
  </div>`
}

export function displayNameEditInput (target, id) {
  const nameSpan = target.previousElementSibling
  const name = nameSpan.innerText
  nameSpan.remove()
  target.insertAdjacentHTML('beforebegin', `
  <div class="input-group input-group-sm mt-2">
    <span class="input-group-text visually-hidden" id="EditNicknameLabel">Small</span>
    <input type="text" class="form-control" id="nicknameInput" aria-label="Edit nickname" aria-describedby="EditNicknameLabel" value="${name}" autocomplete="off">
    <button class="btn btn-secondary" type="button" data-confirm-edit="${id}">Edit nickname</button>
  </div>
  `)
  target.remove()
}

export function setFriendModalBackgroundImage (dataArray) {
  document.querySelector('.hako-modal-background').style.backgroundImage = `url("https://picsum.photos/id/${dataArray.backgroundImageId}/320/240")`
}

export function togglePinIcon (id) {
  document.querySelector(`[data-pin="${id}"]`).classList.toggle('bi-pin-fill')
  document.querySelector(`[data-pin="${id}"]`).classList.toggle('bi-pin')
}

export function displayChatLogOnScreen (target, dataArray) {
  target.innerHTML = ''
  dataArray.forEach(data => {
    if (data.speakId === -1) {
      target.insertAdjacentHTML('beforeend', `
    <li class="list-group-item d-flex justify-content-end border-bottom">
      <span class="h-100 w-100 text-end">${data.log}</span>
    </li>
    `)
    } else {
      target.insertAdjacentHTML('beforeend', `
      <li class="list-group-item d-flex border-bottom">
        <span class="h-100 w-100">${data.log}</span>
      </li>
      `)
    }
  })
}

export function addOneMessageOnScreen (target, message, friendReply = false) {
  friendReply === true
    ? target.insertAdjacentHTML('beforeend', `
    <li class="list-group-item d-flex border-bottom">
      <span class="h-100 w-100">${message}</span>
    </li>
    `)
    : target.insertAdjacentHTML('beforeend', `
    <li class="list-group-item d-flex justify-content-end border-bottom">
      <span class="h-100 w-100 text-end">${message}</span>
    </li>
    `)
}

export function toggleActiveClassForClickedFriend (id) {
  if (document.querySelector('#friendList .active')) {
    document.querySelector('#friendList .active').classList.remove('active')
  }
  document.querySelector(`[data-chat="${id}"]`).classList.add('active')
}

export function updateFriendNameInChatArea (target, dataArray) {
  target.innerHTML = ''
  dataArray.online
    ? target.insertAdjacentHTML('afterbegin', `
    <span class="ps-3 w-100 hako-friend-name bg-success">${dataArray.name} ${dataArray.surname}</span>
    `)
    : target.insertAdjacentHTML('afterbegin', `<span class="ps-3 w-100 hako-friend-name bg-light text-dark">${dataArray.name} ${dataArray.surname}</span>`)
}

export function displayChatConsole () {
  model.elementObject.startChatHint.classList.add('d-none')
  model.elementObject.friendNameChatTo.classList.remove('d-none')
  model.elementObject.messageDisplay.classList.remove('d-none')
  model.elementObject.messageInputContainer.classList.remove('d-none')
}

export function scrollToBottom () {
  document.querySelector('#messageDisplay').scrollTop = document.querySelector('#messageDisplay').scrollHeight
}

export function scrollToTop () {
  model.elementObject.friendList.scroll({ top: 0, left: 0, behavior: 'smooth' })
}

export function updateSettingModal (target, dataArray) {
  target.innerHTML = ''
  let check = ''
  if (dataArray.displayNickname === true) check = 'checked'

  let username = ''
  if (dataArray.username) username = dataArray.username

  let ceremonyDate = ''
  if (dataArray.ceremonyDate) ceremonyDate = dataArray.ceremonyDate

  target.innerHTML = `
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <p class="modal-title text-dark" id="personalSettingsPanelLabel">Settings</p>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="d-flex align-items-start text-dark my-3">
        <div class="nav flex-column nav-pills me-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
          <button class="nav-link active" id="personalSettingTab" data-bs-toggle="pill" data-bs-target="#personalSetting" type="button" role="tab" aria-controls="personalSetting" aria-selected="true">Personal</button>
          <button class="nav-link" id="displaySettingTab" data-bs-toggle="pill" data-bs-target="#displaySetting" type="button" role="tab" aria-controls="displaySetting" aria-selected="false">Display</button>
        </div>
        <div class="tab-content w-75" id="v-pills-tabContent">
          <div class="tab-pane fade show active" id="personalSetting" role="tabpanel" aria-labelledby="personalSettingTab">
              <div class="mb-3">
                <label for="username" class="form-label">How should we call you?</label>
                <input type="text" class="form-control" id="username" autocomplete="off" value="${username}">
              </div>
              <div class="mb-3">
                <label for="ceremony" class="form-label">Any ceremony date?</label>
                <input type="date" class="form-control" id="ceremony" value="${ceremonyDate}">
              </div>
          </div>
          <div class="tab-pane fade" id="displaySetting" role="tabpanel" aria-labelledby="displaySettingTab">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="displayNickname" ${check}>
              <label class="form-check-label" for="displayNickname">
                Display friend's nickname.
              </label>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" id="closeSettingPanel" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button type="button" id="saveSettings" class="btn btn-primary">Save Settings</button>
      </div>
    </div>
  </div>`
}
