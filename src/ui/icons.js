/**
 * @fileoverview HTML buttons for user settings (a/v, avatar, flying, etc.)
 *
 * Open source software under the terms in /LICENSE
 * Copyright (c) 2020, The CONIX Research Center. All rights reserved.
 * @date 2020
 */

/* global AFRAME, ARENA */

import Swal from 'sweetalert2';
import {ARENAJitsi} from '../jitsi';
import {ARENAEventEmitter} from '../event-emitter';
import './remove-stats-exit-fullscreen';

const ICON_BTN_CLASS = 'arena-button arena-side-menu-button';

const SpeedState = Object.freeze({
    MEDIUM: 0,
    FAST:   1,
    SLOW:   2,
});

/**
 * SideMenu component
 */
AFRAME.registerComponent('arena-side-menu-ui', {
    schema: {
        enabled: {type: 'boolean', default: true},

        audioButtonEnabled: {type: 'boolean', default: true},
        audioButtonText: {type: 'string', default: 'Microphone on/off.'},

        videoButtonEnabled: {type: 'boolean', default: true},
        videoButtonText: {type: 'string', default: 'Camera on/off. You appear as a video box.'},

        avButtonEnabled: {type: 'boolean', default: true},
        avButtonText: {type: 'string', default: 'Change A/V options.'},

        avatarButtonEnabled: {type: 'boolean', default: true},
        avatarButtonText: {type: 'string', default: 'Face-recognition on/off. You appear as a 3d-animated face.'},

        speedButtonEnabled: {type: 'boolean', default: true},
        speedButtonText: {type: 'string', default: 'Set movement speed.'},

        flyingButtonEnabled: {type: 'boolean', default: true},
        flyingButtonText: {type: 'string', default: 'Flying on/off.'},

        screenshareButtonEnabled: {type: 'boolean', default: true},
        screenshareButtonText: {type: 'string', default: 'Share your screen in a new window.'},

        logoutButtonEnabled: {type: 'boolean', default: true},
        logoutButtonText: {type: 'string', default: 'Sign out of the ARENA.'},

        additionalSettingsButtonEnabled: {type: 'boolean', default: true},
    },

    dependencies: ['remove-stats-exit-fullscreen'],

    init: function() {
        const data = this.data;
        const el = this.el;

        if (!data.enabled) return;

        if (ARENA.idTag === undefined) {
            ARENA.events.on(ARENAEventEmitter.events.ARENA_STARTED, this.init.bind(this));
            return;
        }

        // button names, to be used by other modules
        this.buttons = {
            AUDIO:          'audio',
            VIDEO:          'video',
            AVATAR:         'avatar',
            SPEED:          'speed',
            FLYING:         'fly',
            SCREENSHARE:    'screenshare',
            AVSETTINGS:     'av-settings',
            LOGOUT:         'logout',
        };

        // we will save a list of the buttons other modules can request to be clicked
        this._buttonList = [];

        this.settingsButtons = [];

        this.iconsDiv = document.getElementById('side-menu');
        this.iconsDiv.parentElement.classList.remove('d-none');

        const isJitsi = ARENA.isJitsiPermitted();
        const isUsers = ARENA.isUsersPermitted();

        this.onAudioButtonClick = this.onAudioButtonClick.bind(this);
        this.onVideoButtonClick = this.onVideoButtonClick.bind(this);
        this.onAVButtonClick = this.onAVButtonClick.bind(this);
        this.onAvatarButtonClick = this.onAvatarButtonClick.bind(this);
        this.onSpeedButtonClick = this.onSpeedButtonClick.bind(this);
        this.onFlyingButtonClick = this.onFlyingButtonClick.bind(this);
        this.onScreenshareButtonClick = this.onScreenshareButtonClick.bind(this);
        this.onLogoutButtonClick = this.onLogoutButtonClick.bind(this);
        this.onAdditionalSettingsButtonClick = this.onAdditionalSettingsButtonClick.bind(this);

        // Create audio button
        if (data.audioButtonEnabled) {
            this.audioButton = createIconButton('audio-off', data.audioButtonText, this.onAudioButtonClick);

            if (isJitsi) {
                this._buttonList[this.buttons.AUDIO] = this.audioButton;
                this.iconsDiv.appendChild(this.audioButton);
            }
        }

        // Create video button
        if (data.videoButtonEnabled) {
            this.videoButton = createIconButton('video-off', data.videoButtonText, this.onVideoButtonClick);

            if (isJitsi) {
                this._buttonList[this.buttons.VIDEO] = this.videoButton;
                this.iconsDiv.appendChild(this.videoButton);
            }
        }

        // Create AV Settings button
        if (data.avButtonEnabled) {
            this.avButton = createIconButton('options', this.avButtonText, this.onAVButtonClick);

            if (isJitsi) {
                this._buttonList[this.buttons.AVSETTINGS] = this.avButton;
                this.iconsDiv.appendChild(this.avButton);
            }
        }

        // Create face tracking button
        if (data.avatarButtonEnabled) {
            this.avatarButton = createIconButton('avatar-off', data.avatarButtonText, this.onAvatarButtonClick);
            this.avatarButton.style.display = 'none';
            this.settingsButtons.push(this.avatarButton);

            if (isUsers && !AFRAME.utils.device.isMobile()) {
                this._buttonList[this.buttons.AVATAR] = this.avatarButton;
                this.iconsDiv.appendChild(this.avatarButton); // no avatar on mobile - face model is too large
            }
        }

        // Create speed button
        if (data.speedButtonEnabled) {
            this.speedState = SpeedState.MEDIUM;
            this.speedButton = createIconButton('speed-medium', data.speedButtonText, this.onSpeedButtonClick);
            this.speedButton.style.display = 'none';
            this.settingsButtons.push(this.speedButton);

            this._buttonList[this.buttons.SPEED] = this.speedButton;
            this.iconsDiv.appendChild(this.speedButton);
        }

        // Create flying on/off button
        if (data.flyingButtonEnabled) {
            this.flying = false;
            this.flyingButton = createIconButton('flying-off', data.flyingButtonText, this.onFlyingButtonClick);
            this.flyingButton.style.display = 'none';
            this.settingsButtons.push(this.flyingButton);

            this._buttonList[this.buttons.FLYING] = this.flyingButton;
            this.iconsDiv.appendChild(this.flyingButton);
        }

        // Create screenshare button
        if (data.screenshareButtonEnabled) {
            this.screenshareButton = createIconButton('screen-on', data.screenshareButtonText, this.onScreenshareButtonClick);
            this.screenshareButton.style.display = 'none';
            this.settingsButtons.push(this.screenshareButton);

            if (isJitsi && !AFRAME.utils.device.isMobile()) { // no screenshare on mobile - doesn't work
                this._buttonList[this.buttons.SCREENSHARE] = this.screenshareButton;
                this.iconsDiv.appendChild(this.screenshareButton);
            }
        }

        // Create logout button
        if (data.logoutButtonEnabled) {
            this.logoutButton = createIconButton('logout', data.logoutButtonText, this.onLogoutButtonClick);
            this.logoutButton.style.display = 'none';
            this.settingsButtons.push(this.logoutButton);

            this._buttonList[this.buttons.LOGOUT] = this.logoutButton;
            this.iconsDiv.appendChild(this.logoutButton);
        }

        // Create additional setting button
        if (data.additionalSettingsButtonEnabled) {
            this.expanded = false;
            this.settingsButton = document.getElementById('side-menu-expand-button');

            this.createAdditionalSettings();
            document.getElementById('side-menu-expand').addEventListener('click', this.onAdditionalSettingsButtonClick);
        }
    },

    createAdditionalSettings: function() {
        // Add settings panel
        this.settingsPopup = document.createElement('div');
        this.settingsPopup.className = 'settings-popup px-3 py-1'; // remove bg-white to inherit transparency
        document.body.appendChild(this.settingsPopup);

        const closeSettingsButton = document.createElement('span');
        closeSettingsButton.className = 'close pe-2';
        closeSettingsButton.innerHTML = '&times';
        this.settingsPopup.appendChild(closeSettingsButton);

        const formDiv = document.createElement('div');
        formDiv.className = 'pb-3';
        this.settingsPopup.appendChild(formDiv);

        let label = document.createElement('span');
        label.innerHTML = 'Settings';
        label.style.fontSize = 'medium';
        label.style.fontStyle = 'bold';
        formDiv.appendChild(label);

        // Scene status dialogs
        const statusDiv = document.createElement('div');
        appendBold(statusDiv, 'Status: ');
        formDiv.appendChild(statusDiv);

        const credits = document.createElement('a');
        credits.href = '#';
        credits.innerHTML = 'Credits';
        credits.title = 'Show the credits for models in the scene';
        credits.onclick = this.showCredits.bind(this);
        statusDiv.appendChild(credits);

        statusDiv.append(' | ');

        const stats = document.createElement('a');
        stats.href = '#';
        stats.innerHTML = 'Stats';
        stats.title = 'Show the A-Frame performance stats and user pose data for you';
        stats.onclick = this.showStats.bind(this);
        statusDiv.append(stats);

        statusDiv.append(' | ');

        const perms = document.createElement('a');
        perms.href = '#';
        perms.innerHTML = 'Permissions';
        perms.title = 'Show the security permissions for you in the scene';
        perms.onclick = showPerms;
        statusDiv.appendChild(perms);

        // Page links
        const pagesDiv = document.createElement('div');
        appendBold(pagesDiv, 'Pages: ');
        formDiv.appendChild(pagesDiv);

        const edit = document.createElement('a');

        edit.href = `/build/?scene=${ARENA.namespacedScene}`;
        edit.target = 'ArenaJsonEditor';
        edit.rel = 'noopener noreferrer';
        edit.innerHTML = 'Json Editor';
        edit.title = 'Open the JSON Scene Editor for this scene in a new page';
        pagesDiv.appendChild(edit);

        pagesDiv.append(' | ');

        if (ARENA.isUserSceneWriter()) { // add permissions link
            const edit3d = document.createElement('a');
            edit3d.href = `/${ARENA.namespacedScene}?build3d=1`;
            edit3d.target = 'Arena3dEditor';
            edit3d.rel = 'noopener noreferrer';
            edit3d.innerHTML = '3D Editor';
            edit3d.title = 'Open the 3D Scene Editor for this scene in a new page (editors only)';
            pagesDiv.appendChild(edit3d);

            pagesDiv.append(' | ');
        }

        const profile = document.createElement('a');
        profile.href = '#';
        profile.innerHTML = 'Profile';
        profile.title = 'Open your user account Profile in a new page';
        profile.onclick = showProfile;
        pagesDiv.append(profile);

        pagesDiv.append(' | ');

        const docs = document.createElement('a');
        docs.href = 'https://docs.arenaxr.org';
        docs.target = '_blank';
        docs.rel = 'noopener noreferrer';
        docs.innerHTML = 'Docs';
        docs.title = 'Open the ARENA documentation in another page';
        pagesDiv.appendChild(docs);

        pagesDiv.append(' | ');

        const version = document.createElement('a');
        version.href = '/conf/versions.html';
        version.target = '_blank';
        version.rel = 'noopener noreferrer';
        version.innerHTML = 'Version';
        version.title = 'Show the ARENA versions listed on a new page';
        pagesDiv.appendChild(version);

        // Auth status
        appendBold(formDiv, 'Scene: ');
        this.sceneNameDiv = document.createElement('span');
        formDiv.appendChild(this.sceneNameDiv);
        if (ARENA.isUserSceneWriter()) { // add permissions link
            formDiv.append(" (");
            const aSec = document.createElement("a");
            aSec.href = `/user/profile/scenes/${ARENA.namespacedScene}`;
            aSec.target = "_blank";
            aSec.rel = "noopener noreferrer";
            aSec.innerHTML = "Security";
            aSec.title = 'Open the security controls for the scene (editors only)';
            formDiv.appendChild(aSec);
            formDiv.append(")");
        }
        formDiv.appendChild(document.createElement('br'));

        appendBold(formDiv, 'Authenticator: ');
        this.authType = document.createElement('span');
        this.authType.style.textTransform = 'capitalize';
        formDiv.appendChild(this.authType);
        formDiv.appendChild(document.createElement('br'));

        appendBold(formDiv, 'ARENA Username: ');
        this.authUsername = document.createElement('span');
        formDiv.appendChild(this.authUsername);
        formDiv.appendChild(document.createElement('br'));

        appendBold(formDiv, 'Email: ');
        this.authEmail = document.createElement('span');
        formDiv.appendChild(this.authEmail);
        formDiv.appendChild(document.createElement('br'));

        appendBold(formDiv, 'Name: ');
        this.authFullname = document.createElement('span');
        formDiv.appendChild(this.authFullname);

        this.usernameInputDiv = document.createElement('div');
        this.usernameInputDiv.className = 'my-2';

        label = document.createElement('label');
        label.className= 'form-label mb-0';
        label.setAttribute('for', 'settingsUsernameInput');
        label.innerHTML = 'Display Name';
        this.usernameInputDiv.appendChild(label);

        this.nameRegex = '^(?=[^A-Za-z]*[A-Za-z]{2,})[ -~]*$';
        this.usernameInput = document.createElement('input');
        this.usernameInput.setAttribute('type', 'text');
        this.usernameInput.setAttribute('pattern', this.nameRegex);
        this.usernameInput.setAttribute('name', 'settingsUsernameInput');
        this.usernameInput.className='form-control';
        this.usernameInputDiv.appendChild(this.usernameInput);

        formDiv.appendChild(this.usernameInputDiv);

        const saveSettingsButton = document.createElement('button');
        saveSettingsButton.innerHTML = 'Save';
        saveSettingsButton.className = 'btn btn-info btn-sm';
        formDiv.appendChild(saveSettingsButton);

        const iconCredits = document.createElement('p');
        iconCredits.innerHTML = 'Icons made by <a href="https://www.flaticon.com/authors/smashicons" title="Smashicons">Smashicons</a>, <a href="https://www.freepik.com" title="Freepik">Freepik</a> from <a href="https://www.flaticon.com/" title="Flaticon">www.flaticon.com</a>';
        formDiv.appendChild(iconCredits);

        const _this = this;
        closeSettingsButton.onclick = function() {
            _this.settingsPopup.style.display = 'none'; // close settings panel
            _this.saveSettings();
        };

        saveSettingsButton.onclick = function() {
            _this.saveSettings();
        };

        /**
         * Embolden text.
         * @param {*} el Element object
         * @param {*} text Text to bold
         */
        function appendBold(el, text) {
            const b = document.createElement('b');
            b.innerText = text;
            el.append(b);
        }
    },

    onAudioButtonClick: function() {
        const data = this.data;
        const el = this.el;

        if (!ARENA.Jitsi.hasAudio) { // toggled
            ARENA.Jitsi.unmuteAudio()
                .then(() => {
                    this.audioButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/audio-on.png\')';
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            ARENA.Jitsi.muteAudio()
                .then(() => {
                    this.audioButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/audio-off.png\')';
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    },

    onVideoButtonClick: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;

        if (!ARENA.Jitsi.hasVideo) { // toggled
            if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

            ARENA.Jitsi.startVideo()
                .then(() => {
                    this.videoButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/video-on.png\')';
                    this.avatarButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/avatar-off.png\')';
                    ARENA.Jitsi.showVideo();
                    const faceTracker = document.querySelector('a-scene').systems['face-tracking'];
                    if (faceTracker !== undefined && faceTracker.isRunning()) {
                        faceTracker.stop();
                    }
                })
                .catch((err) => {
                    console.log(err);
                });
        } else {
            this.videoButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/video-off.png\')';
            ARENA.Jitsi.stopVideo()
                .then(() => {
                    ARENA.Jitsi.hideVideo();
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    },

    onAvatarButtonClick: async function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;

        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

        // dynamically import face tracking module
        let faceTracker = document.querySelector('a-scene').systems['face-tracking'];
        if (faceTracker === undefined) {
            await import('../systems/face-tracking/index.js');
            faceTracker = document.querySelector('a-scene').systems['face-tracking'];
            if (!faceTracker) return;
        }

        if (!faceTracker.isRunning()) { // toggled
            faceTracker.run().then(() => {
                this.avatarButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/avatar-on.png\')';
                if (ARENA.Jitsi && ARENA.Jitsi.ready) {
                    ARENA.Jitsi.stopVideo().then(() => {
                        this.videoButton.childNodes[0].style.backgroundImage =
                                                                'url(\'src/ui/images/video-off.png\')';
                        ARENA.Jitsi.hideVideo();
                    });
                }
            });
        } else {
            faceTracker.stop().then(() => {
                this.avatarButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/avatar-off.png\')';
            });
        }
    },

    onAVButtonClick: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;

        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

        window.setupAV(ARENA.Jitsi.avConnect.bind(ARENA.Jitsi))
    },

    onSpeedButtonClick: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;
        const cameraEl = sceneEl.camera.el;

        const speedMod = Number(ARENA.sceneOptions?.speedModifier) || 1;
        if (speedMod) { // Set new initial speed if applicable
            cameraEl.setAttribute('wasd-controls', {'acceleration': 30 * speedMod});
            cameraEl.setAttribute('press-and-move', {'acceleration': 30 * speedMod});
        }

        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

        this.speedState = (this.speedState + 1) % 3;
        if (this.speedState === SpeedState.MEDIUM) { // medium
            this.speedButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/speed-medium.png\')';
            cameraEl.setAttribute('wasd-controls', {'acceleration': 30 * speedMod});
            cameraEl.setAttribute('press-and-move', {'acceleration': 30 * speedMod});
        } else if (this.speedState === SpeedState.FAST) { // fast
            this.speedButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/speed-fast.png\')';
            cameraEl.setAttribute('wasd-controls', {'acceleration': 60 * speedMod});
            cameraEl.setAttribute('press-and-move', {'acceleration': 60 * speedMod});
        } else if (this.speedState === SpeedState.SLOW) { // slow
            this.speedButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/speed-slow.png\')';
            cameraEl.setAttribute('wasd-controls', {'acceleration': 15 * speedMod});
            cameraEl.setAttribute('press-and-move', {'acceleration': 15 * speedMod});
        }
    },

    onFlyingButtonClick: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;
        const cameraEl = sceneEl.camera.el;

        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

        this.flying = !this.flying;
        if (this.flying) { // toggled on
            this.flyingButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/flying-on.png\')';
        } else { // toggled off
            cameraEl.components['wasd-controls'].resetNav();
            cameraEl.components['press-and-move'].resetNav();
            cameraEl.object3D.position.y = ARENA.startCoords.y + ARENA.defaults.camHeight;
            this.flyingButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/flying-off.png\')';
        }
        cameraEl.setAttribute('wasd-controls', {'fly': this.flying});
        cameraEl.setAttribute('press-and-move', {'fly': this.flying});
    },

    onScreenshareButtonClick: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;
        const cameraEl = sceneEl.camera.el;

        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

        this.flying = !this.flying;
        if (this.flying) { // toggled on
            this.flyingButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/flying-on.png\')';
        } else { // toggled off
            cameraEl.components['wasd-controls'].resetNav();
            cameraEl.components['press-and-move'].resetNav();
            cameraEl.object3D.position.y = ARENA.startCoords.y + ARENA.defaults.camHeight;
            this.flyingButton.childNodes[0].style.backgroundImage = 'url(\'src/ui/images/flying-off.png\')';
        }
        cameraEl.setAttribute('wasd-controls', {'fly': flying});
        cameraEl.setAttribute('press-and-move', {'fly': flying});
    },

    onScreenshareButtonClick: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;
        const cameraEl = sceneEl.camera.el;

        if (sceneEl.is('vr-mode') || sceneEl.is('ar-mode')) return;

        Swal.fire({
            title: 'You clicked on screen share! Are you sure you want to share your screen?',
            html: `In order to share your screen, ARENA will open a new tab.<br>
                <i>Make sure you have screen share permissions enabled for this browser!</i>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            reverseButtons: true,
        })
        .then((result) => {
            if (!result.isConfirmed) return;

            Swal.fire({
                title: 'Select the object(s) you want to screenshare on:',
                html: document.querySelector('a-scene').systems['screenshareable'].asHTMLSelect(),
                focusConfirm: false,
                preConfirm: () => {
                    return Array.from(document.getElementById('screenshareables').
                        querySelectorAll('option:checked'), (e) => e.value);
                },
                showCancelButton: true,
                reverseButtons: true,
            })
            .then((result) => {
                if (!result.isConfirmed || result.value.length == 0) return;
                const objectIds = result.value;

                const screenshareWindow = window.open('./screenshare', '_blank');
                screenshareWindow.params = {
                    connectOptions: ARENA.Jitsi.connectOptions,
                    appID: ARENAJitsi.ARENA_APP_ID,
                    token: ARENA.mqttToken,
                    screenSharePrefix: ARENAJitsi.SCREENSHARE_PREFIX,
                    conferenceName: ARENA.Jitsi.arenaConferenceName,
                    displayName: cameraEl.getAttribute('arena-camera').displayName,
                    camName: ARENA.camName,
                    objectIds: objectIds.join(),
                };
            });
        });
    },

    onLogoutButtonClick: function() {
        Swal.fire({
            title: 'You are about to sign out of the ARENA!',
            text: 'Are you sure you want to sign out?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            reverseButtons: true,
        })
        .then((result) => {
            if (result.isConfirmed) {
                signOut();
            }
        });
    },

    onAdditionalSettingsButtonClick: function() {
        this.expanded = !this.expanded;
        if (this.expanded) { // toggled
            this.settingsButton.classList.replace('fa-angle-down', 'fa-angle-up');
            for (let i = 0; i < this.settingsButtons.length; i++) {
                this.settingsButtons[i].style.display = 'block';
            }
            this.settingsPopup.style.display = 'block'; // open settings panel
            this.loadSettings();
        } else {
            this.settingsButton.classList.replace('fa-angle-up', 'fa-angle-down');
            for (let i = 0; i < this.settingsButtons.length; i++) {
                this.settingsButtons[i].style.display = 'none';
            }
            this.settingsPopup.style.display = 'none'; // close settings panel
            this.saveSettings();
        }
    },

    loadSettings: function() {
        this.usernameInput.value = localStorage.getItem('display_name');

        const auth = getAuthStatus();
        this.sceneNameDiv.textContent = ARENA.namespacedScene;
        this.authType.textContent = auth.type;
        this.authUsername.textContent = auth.username;
        this.authFullname.textContent = auth.fullname;
        this.authEmail.textContent = auth.email;
    },

    saveSettings: function() {
        const data = this.data;
        const el = this.el;

        const sceneEl = el;
        const cameraEl = sceneEl.camera.el;

        const re = new RegExp(this.nameRegex);
        // if name has at least one alpha char
        if (re.test(this.usernameInput.value)) {
            // remove extra spaces
            const displayName = this.usernameInput.value.replace(/\s+/g, ' ').trim();
            localStorage.setItem('display_name', displayName); // save for next use
            cameraEl.setAttribute('arena-camera', 'displayName', displayName); // push to other users' views
            ARENA.events.emit(ARENAEventEmitter.events.NEW_SETTINGS, {userName: displayName});
        }
    },

    showStats: function(e) {
        e.preventDefault();
        const sceneEl = document.querySelector('a-scene');
        const statsEl = sceneEl.getAttribute('stats');
        sceneEl.setAttribute('stats', !statsEl);
        const cam = document.getElementById('my-camera');
        const showStats = cam.getAttribute('arena-camera').showStats;
        cam.setAttribute('arena-camera', {
            showStats: !showStats,
        });
    },

    showCredits: function(e) {
        e.preventDefault();
        this.settingsPopup.style.display = 'none'; // close settings panel
        const attrSystem = document.querySelector('a-scene').systems['attribution'];
        let attrTable = undefined;
        if (attrSystem) {
            attrTable = attrSystem.getAttributionTable();
        }
        if (attrTable === undefined) {
            Swal.fire({
                title: 'Scene Credits',
                text: 'Could not find any attributions (did you add an attribution component to models?).',
                icon: 'error',
            })
            .then(() => {
                this.settingsPopup.style.display = 'block'; // show settings panel
            });
            return;
        }
        Swal.fire({
            title: 'Scene Credits',
            html: attrTable,
            width: 800,
            focusConfirm: false,
            showCancelButton: false,
            cancelButtonText: 'Cancel',
        })
        .then(() => {
            this.settingsPopup.style.display = 'block';
        });
    },

    clickButton: function(button) {
        this._buttonList[button].onClick();
    },
});

/**
 * Creates a button that will be displayed as an icon on the left of the screen
 * @param {string} initialImage name of initial image to be displayed
 * @param {string} tooltip tip to be displayed on hover
 * @param {function} onClick function that will be run on click
 * @return {Object} div that is the parent of the button
 */
function createIconButton(initialImage, tooltip, onClick) {
    // Create elements.
    const wrapper = document.createElement('div');
    const iconButton = document.createElement('button');
    iconButton.style.backgroundImage = `url('src/ui/images/${initialImage}.png')`;
    iconButton.className = ICON_BTN_CLASS;
    iconButton.setAttribute('id', 'btn-' + initialImage);
    iconButton.setAttribute('title', tooltip);

    // Insert elements.
    wrapper.appendChild(iconButton);
    iconButton.addEventListener('click', function(evt) {
        onClick();
        evt.stopPropagation();

        // Button focus is different per browser, so set manual focus. In general, we need to check
        // UI elements on our overlay that can keep input focus, since the natural implementation
        // on most browsers is that input elements capture tab/arrow/+chars for DOM navigation and
        // input.

        // Chrome appears to leave focus on the button, but we need it back to body for 3D navigation.
        document.activeElement.blur();
        document.body.focus();
    });

    wrapper.onClick = onClick;
    return wrapper;
}
