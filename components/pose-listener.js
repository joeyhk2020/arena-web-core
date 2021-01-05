AFRAME.registerComponent('pose-listener', {
    // if we want to make throttling settable at init time over mqtt,
    // create a Component variable here & use instead of globals.updateMillis
    init: function() {
        // Set up the tick throttling.
        this.tick = AFRAME.utils.throttleTick(this.tick, globals.updateMillis, this);
        this.heartBeatCounter = 1;
    },

    tick: (function(t, dt) {
        globals.newRotation.setFromRotationMatrix(this.el.object3D.matrixWorld);
        globals.newPosition.setFromMatrixPosition(this.el.object3D.matrixWorld);

        camParent = this.el.object3D.parent.matrixWorld;
        cam = this.el.object3D.matrixWorld;
        cpi.getInverse(camParent);
        cpi.multiply(cam);
        globals.vioMatrix.copy(cpi);
        globals.vioRotation.setFromRotationMatrix(cpi);
        globals.vioPosition.setFromMatrixPosition(cpi);
        // console.log(cpi);

        const rotationCoords = rotToText(globals.newRotation);
        const positionCoords = coordsToText(globals.newPosition);

        const newPose = rotationCoords + ' ' + positionCoords;

        // update position every 1 sec
        if (this.lastPose !== newPose || this.heartBeatCounter % (1000 / globals.updateMillis) == 0) {
            this.el.emit('poseChanged', Object.assign(globals.newPosition, globals.newRotation));
            this.el.emit('vioChanged', Object.assign(globals.vioPosition, globals.vioRotation));
            this.lastPose = newPose;
        }
        this.heartBeatCounter++;
    }),
});
