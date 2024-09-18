var Sound = function(context) {

    var audioTest = document.createElement('audio'),
		canPlayMp3 = !!audioTest.canPlayType && audioTest.canPlayType('audio/mpeg;'),
		canPlayWav = !!audioTest.canPlayType && audioTest.canPlayType('audio/wav; codecs="1"'),
		soundUrl = '',
		supportsHtml5 = true,
		audio = null;

    canPlayMp3 = !!canPlayMp3 && canPlayMp3.length > 0;
    canPlayWav = !!canPlayWav && canPlayWav.length > 0;

    if (canPlayMp3) {
        soundUrl = context.urls.mp3sound;
    } else if (canPlayWav) {
        soundUrl = context.urls.wavsound;
    } else {
        supportsHtml5 = false;
    }

    if (supportsHtml5) {
        audio = new Audio(soundUrl);
        audio.preload = 'auto';
        audio.load();
    }

    function play() {
        if (audio) {
            try {
                audio.currentTime = 0;
                audio.play();
            } catch (e) { }
        }
    }

    return {
      play: function() {
          return play();
      }
    };
};