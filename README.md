
# xpHoot App

![xpHoot Logo](./src/main/resources/assets/img/logo.png)

## The Quest

Once upon a time, three backend-developers that were awed by the enjoyment of http://kahoot.it asked themselves how difficult it would be to create a (suspiciously) similar app using Enonic XP. They wondered if the powers of [lib/xp/websockets](http://repo.enonic.com/public/com/enonic/xp/docs/6.5.2/docs-6.5.2-libdoc.zip!/module-lib_xp_websocket.html), a single sprint, their bare hands and meagre front-end skills would be enough to conquer this quest?

## The Journey

Filled with fear of the dreaded beast of the css, but equally encouraged by the apparent mightyness of the spiked club of websocket-lib they left their safe haven of backendtown, and started designing the application flow. And it was beautiful. The pieces clicked together like they had been practicing all their life for this particular task, and the websocket-lib swashed away all the foes of complexity. 

After only two days of travel, the beast of css stood before them, the last obstacle before they could be successful. And it was indeed a mighty opponent, but with guidance by the wise masters of frontend and the secret, ancient algorithm of "changing stuff and seeing what happens", they were able to slay the beast and capture the...eh..artifact of xpHoot. 


## Features

* Easily create and manage quizzes in the Content Studio
* Support for Images in questions
* Support for Spotify-id's and uploaded mp3-files in questions
* Quiz background music
* Results are stored and will be used for statistics in future versions

## Upcoming features

* ~~Client keep-alive handling~~
* ~~End question-timer when all connected players have answered~~
* Quiz statistics
* Show score stats/changes on client on answer

## Spotify Integration

Using Spotify music tracks in the questions requires access to their [API](https://developer.spotify.com/web-api/). 
Previously Spotify API was open but [now the requests need to be authenticated](https://developer.spotify.com/news-stories/2017/01/27/removing-unauthenticated-calls-to-the-web-api/).

To set up Spotify in xpHoot follow these steps:
- Go to https://developer.spotify.com/my-applications/ 
- Sign in or register as a new user.
- Click on "Create an App" and enter a name and a description.
- Copy the text from the generated **Client ID** and **Client Secret**.
- Edit the xpHoot site in Enonic XP.
- Click the pencil icon to edit the xpHoot App settings.
- Enter the **Client ID** and **Client Secret**. Click Apply and then Save.

Note that _not all_ the tracks available provide the 30 second preview that can be used in xpHoot questions. (See also [issue #592](https://github.com/spotify/web-api/issues/592) and [issue #516](https://github.com/spotify/web-api/issues/516)). 

Tracks that support the preview will appear with a small music note icon :musical_note: in Content Studio editor. 

