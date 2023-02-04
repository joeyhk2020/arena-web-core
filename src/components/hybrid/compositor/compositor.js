import {CompositorPass} from './compositor-pass';

AFRAME.registerSystem('compositor', {
    init: function() {
        const sceneEl = this.sceneEl;

        if (!sceneEl.hasLoaded) {
            sceneEl.addEventListener('renderstart', this.init.bind(this));
            return;
        }

        const renderer = sceneEl.renderer;

        this.cameras = [];

        this.originalRenderFunc = null;

        this.renderTarget = new THREE.WebGLRenderTarget(1,1);
        this.renderTarget.texture.name = 'EffectComposer.rt1';
        this.renderTarget.texture.minFilter = THREE.NearestFilter;
        this.renderTarget.texture.magFilter = THREE.NearestFilter;
        this.renderTarget.stencilBuffer = false;
        this.renderTarget.depthTexture = new THREE.DepthTexture();
        this.renderTarget.depthTexture.format = THREE.DepthFormat;
        this.renderTarget.depthTexture.type = THREE.UnsignedShortType;

        this.onResize();
        window.addEventListener('resize', this.onResize.bind(this));
        renderer.xr.addEventListener('sessionstart', this.onResize.bind(this));
        renderer.xr.addEventListener('sessionend', this.onResize.bind(this));
    },

    handleRemoteTrack(stream) {
        this.remoteVideo = document.getElementById('remoteVideo');
        if (!this.remoteVideo) {
            this.remoteVideo = document.createElement('video');
            this.remoteVideo.id = 'remoteVideo';
            this.remoteVideo.setAttribute('muted', 'false');
            this.remoteVideo.setAttribute('autoplay', 'true');
            this.remoteVideo.setAttribute('playsinline', 'true');
            this.remoteVideo.addEventListener('loadedmetadata', this.onRemoteVideoLoaded.bind(this), true);

            this.remoteVideo.style.position = 'absolute';
            this.remoteVideo.style.zIndex = '9999';
            this.remoteVideo.style.top = '15px';
            this.remoteVideo.style.left = '15px';
            this.remoteVideo.style.width = '640px';
            this.remoteVideo.style.height = '180px';
            if (!AFRAME.utils.device.isMobile()) {
                document.body.appendChild(this.remoteVideo);
            }
        }
        this.remoteVideo.style.display = 'block';
        this.remoteVideo.srcObject = stream;
    },

    onRemoteVideoLoaded() {
        // console.log('[render-client], remote video loaded!');
        const sceneEl = this.sceneEl;
        const renderer = sceneEl.renderer;

        const scene = sceneEl.object3D;
        const camera = sceneEl.camera;

        this.pass = new CompositorPass(scene, camera, this.remoteVideo);

        this.t = 0;
        this.dt = 0;

        this.onResize();
        this.remoteVideo.play();

        this.bind();
    },

    onResize() {
        const sceneEl = this.sceneEl;
        const renderer = sceneEl.renderer;

        var rendererSize = new THREE.Vector2();
        renderer.getSize(rendererSize);
        const pixelRatio = renderer.getPixelRatio();
        this.renderTarget.setSize(pixelRatio * rendererSize.width, pixelRatio * rendererSize.height);
        if (this.pass) {
            this.pass.setSize(pixelRatio * rendererSize.width, pixelRatio * rendererSize.height);
        }
    },

    tick: function(t, dt) {
        this.t = t;
        this.dt = dt;
    },

    bind: function() {
        const renderer = this.sceneEl.renderer;
        const render = renderer.render;
        const mainCamera = document.getElementById('my-camera');
        const system = this;
        let isDigest = false;

        this.originalRenderFunc = render;

        this.sceneEl.object3D.onBeforeRender = function(renderer, scene, camera) {
            if (camera instanceof THREE.ArrayCamera) {
                system.cameras = camera.cameras;
            } else {
                system.cameras.push(camera);
            }
        }

        let hasDualCameras = false;

        let currentXREnabled = renderer.xr.enabled;
        let currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

        const isWebXRViewer = navigator.userAgent.includes('WebXRViewer');

        const cameraLPos = new THREE.Vector3();
        const cameraRPos = new THREE.Vector3();
        const sizeVector = new THREE.Vector2();
        renderer.render = function() {
            const size = renderer.getSize(sizeVector);
            if (isDigest) {
                // render "normally"
                render.apply(this, arguments);
            } else {
                isDigest = true;

<<<<<<< HEAD
                var currentRenderTarget = this.getRenderTarget();
=======
                // save render state (1)
                const currentRenderTarget = this.getRenderTarget();
>>>>>>> finally got local rendering to look right
                if (currentRenderTarget != null) {
                    // resize if an existing rendertarget exists (usually in webxr mode)
                    system.pass.setSize(currentRenderTarget.width, currentRenderTarget.height);
                    system.renderTarget.setSize(currentRenderTarget.width, currentRenderTarget.height);
                }
<<<<<<< HEAD
=======

                // store "normal" rendering output to this.renderTarget
>>>>>>> finally got local rendering to look right
                this.setRenderTarget(system.renderTarget);
                render.apply(this, arguments);
                this.setRenderTarget(currentRenderTarget);

<<<<<<< HEAD
                currentXREnabled = this.xr.enabled;
                if (this.xr.enabled === true) {
                    this.xr.enabled = false;
                }
=======
                // save render state (2)
                currentXREnabled = this.xr.enabled;
                currentShadowAutoUpdate = this.shadowMap.autoUpdate;

                // disable xr
                this.xr.enabled = false;
                this.shadowMap.autoUpdate = false;
>>>>>>> finally got local rendering to look right

                if (system.cameras.length > 1) {
                    // we have two cameras here (vr mode or headset ar mode)
                    hasDualCameras = !isWebXRViewer; // webarviewer seens to have 2 cameras, but uses one...

                    const cameraL = system.cameras[0];
                    const cameraR = system.cameras[1];
                    cameraLPos.setFromMatrixPosition( cameraL.matrixWorld );
                    cameraRPos.setFromMatrixPosition( cameraR.matrixWorld );
                    const ipd = cameraLPos.distanceTo( cameraRPos );

                    AFRAME.utils.entity.setComponentProperty(mainCamera, 'render-client.ipd', ipd);

                    /* const projL = cameraL.projectionMatrix.elements;
                    const projR = cameraR.projectionMatrix.elements;

                    const near = projL[ 14 ] / ( projL[ 10 ] - 1 );
                    const far = projL[ 14 ] / ( projL[ 10 ] + 1 );
                    const topFov = ( projL[ 9 ] + 1 ) / projL[ 5 ];
                    const bottomFov = ( projL[ 9 ] - 1 ) / projL[ 5 ];

                    const leftFov = ( projL[ 8 ] - 1 ) / projL[ 0 ];
                    const rightFov = ( projR[ 8 ] + 1 ) / projR[ 0 ];
                    const left = near * leftFov;
                    const right = near * rightFov; */
                } else {
                    // we just have a single camera here
                    hasDualCameras = false;
                }

                // render with custom shader (local-remote compositing):
                // this will internally call renderer.render(), which will execute the code within
                // the isDigest conditional above (render normally). this will copy the result of
                // the rendering to the readbuffer in the compositor (aka this.renderTarget), which we
                // will use for the "local" frame.
                // the composer will take the "local" frame and merge it with the "remote" frame from
                // the video by calling the compositor pass and executing the shaders.
                system.pass.render(this, currentRenderTarget, system.renderTarget);

                // restore render state
                this.setRenderTarget(currentRenderTarget);
                this.xr.enabled = currentXREnabled;
                this.shadowMap.autoUpdate = currentShadowAutoUpdate;

                system.pass.setHasDualCameras(hasDualCameras);
                AFRAME.utils.entity.setComponentProperty(mainCamera, 'render-client.hasDualCameras', hasDualCameras);

                // call this part of the conditional again on the next call to render()
                isDigest = false;

                system.cameras = [];
            }
        };
    },

    unbind: function() {
        const renderer = this.sceneEl.renderer;
        renderer.render = this.originalRenderFunc;
        this.sceneEl.object3D.onBeforeRender = () => {};
        this.remoteVideo.style.display = 'none';
    },
});
