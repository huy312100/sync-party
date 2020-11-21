import React, { MutableRefObject, ReactElement, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Rnd } from 'react-rnd';
import { rndHandleStyles } from '../../../common/helpers';
import WebRtcOtherVideo from '../WebRtcOtherVideo/WebRtcOtherVideo';
import WebRtcVideoOverlayMenu from '../WebRtcVideoOverlayMenu/WebRtcVideoOverlayMenu';

interface Props {
    videoIsActive: boolean;
    mediaStreams: {
        [webRtcId: string]: MediaStream;
    };
    mediaStreamsRef: React.MutableRefObject<{
        [webRtcId: string]: MediaStream;
    }>;
    ourUserId: string;
    webRtcIds: WebRtcIds;
    showVideos: boolean;
    handlePlayPause: Function;
}

export default function WebRtc({
    videoIsActive,
    mediaStreams,
    mediaStreamsRef,
    ourUserId,
    webRtcIds,
    showVideos,
    handlePlayPause
}: Props): ReactElement | null {
    const ourWebRtcId = webRtcIds[ourUserId];

    const userIdWebRtcIdMap: {
        [webRtcId: string]: string;
    } = {};
    Object.keys(webRtcIds).forEach((userId) => {
        const webRtcId = webRtcIds[userId];
        userIdWebRtcIdMap[webRtcId] = userId;
    });

    const memberStatus = useSelector(
        (state: RootAppState) => state.globalState.memberStatus
    );
    const uiVisible = useSelector(
        (state: RootAppState) => state.globalState.uiVisible
    );

    const [displayOverlayMenu, setDisplayOverlayMenu] = useState(false);
    const [displayOwnVideo, setDisplayOwnVideo] = useState(true);
    const [displayVertically, setDisplayVertically] = useState(false);
    const webRtcIsFullscreen = useSelector(
        (state: RootAppState) => state.globalState.webRtc.isFullscreen || false
    );

    const rndRef: MutableRefObject<Rnd | null> = useRef(null);

    const displayedMediaStreams: {
        webRtcId: string;
        mediaStream: MediaStream;
    }[] = [];

    let hasVideo = false;
    let otherVideosAmount = 0;

    if (ourWebRtcId) {
        Object.keys(mediaStreams).forEach((webRtcId) => {
            if (mediaStreams[webRtcId].getVideoTracks().length) {
                hasVideo = true;
            }

            if (webRtcId !== ourWebRtcId) {
                otherVideosAmount++;
            }

            displayedMediaStreams.push({
                webRtcId: webRtcId,
                mediaStream: mediaStreams[webRtcId]
            });
        });
    }

    otherVideosAmount = 4;

    const otherVideos = (
        <div
            className={
                webRtcIsFullscreen ? ' bg-black z-40 w-full h-full flex' : ''
            }
            onMouseOver={(): void => setDisplayOverlayMenu(true)}
            onMouseLeave={(): void => setDisplayOverlayMenu(false)}
        >
            <WebRtcVideoOverlayMenu
                displayVertically={displayVertically}
                setDisplayVertically={(): void => {
                    if (rndRef.current) {
                        let newSize = {
                            width: '50vw',
                            height: 'auto'
                        };

                        if (!displayVertically) {
                            newSize = {
                                width: '100px',
                                height: 'auto'
                            };
                        }

                        rndRef.current.updateSize(newSize);
                        rndRef.current.forceUpdate();
                    }
                    setDisplayVertically(!displayVertically);
                }}
                isActive={displayOverlayMenu}
                displayOwnVideo={displayOwnVideo}
                setDisplayOwnVideo={setDisplayOwnVideo}
                otherVideosAmount={otherVideosAmount}
            />
            <div
                className={
                    webRtcIsFullscreen
                        ? ' flex w-full h-full relative z-40' +
                          (otherVideosAmount > 2 ? ' flex-wrap' : '')
                        : displayVertically
                        ? ''
                        : ' flex-row flex'
                }
                onMouseDown={(): void => {
                    if (webRtcIsFullscreen) {
                        handlePlayPause();
                    }
                }}
            >
                {displayedMediaStreams.map((displayedMediaStream) => {
                    const isOwnVideo =
                        displayedMediaStream.webRtcId === ourWebRtcId;

                    return [1, 2, 3, 4].map((number) => {
                        return (
                            <WebRtcOtherVideo
                                key={displayedMediaStream.webRtcId}
                                displayVertically={displayVertically}
                                displayedMediaStream={displayedMediaStream}
                                isOwnVideo={isOwnVideo}
                                mediaStreamsRef={mediaStreamsRef}
                                memberStatus={memberStatus}
                                userIdWebRtcIdMap={userIdWebRtcIdMap}
                                webRtcIsFullscreen={webRtcIsFullscreen}
                                otherVideosAmount={otherVideosAmount}
                            ></WebRtcOtherVideo>
                        );
                    });
                })}
            </div>
        </div>
    );

    const ownVideo = (
        <div className="flex flex-row">
            {displayedMediaStreams.map((mediaStream) => {
                const isOwnVideo = mediaStream.webRtcId === ourWebRtcId;

                if (isOwnVideo) {
                    return (
                        <div
                            key={mediaStream.webRtcId}
                            className={
                                'overflow-hidden bg-transparent mr-2 rounded'
                            }
                            style={{
                                height: '100%',
                                width: '100%',
                                minWidth: '30px'
                            }}
                        >
                            <video
                                muted={true}
                                className="min-w-full min-h-full overflow-hidden object-cover"
                                ref={(video): void => {
                                    if (video) {
                                        if (
                                            video.srcObject !==
                                            mediaStreamsRef.current[
                                                mediaStream.webRtcId
                                            ]
                                        ) {
                                            video.srcObject =
                                                mediaStreamsRef.current[
                                                    mediaStream.webRtcId
                                                ];
                                        }
                                    }
                                }}
                                onLoadedMetadata={(event): void => {
                                    event.currentTarget.play();
                                }}
                                style={{
                                    WebkitTransform: 'scaleX(-1)',
                                    transform: 'scaleX(-1)'
                                }}
                            ></video>
                        </div>
                    );
                } else {
                    return null;
                }
            })}
        </div>
    );

    if (hasVideo) {
        return (
            <div
                className={
                    'absolute top-0 left-0' +
                    (!showVideos ? ' invisible' : '') +
                    (webRtcIsFullscreen
                        ? ' w-screen h-screen'
                        : ' ml-2' + (uiVisible ? ' mb-20' : ' mb-10'))
                }
            >
                {videoIsActive &&
                    ourWebRtcId &&
                    (webRtcIsFullscreen ? (
                        <div className="flex flex-col h-full">
                            {otherVideos}
                        </div>
                    ) : (
                        <div className="mt-12 absolute top-0 left-0">
                            <Rnd
                                ref={rndRef}
                                default={{
                                    x: 0,
                                    y: 0,
                                    width: '50vh',
                                    height: 'auto'
                                }}
                                maxWidth={'90vw'}
                                resizeHandleStyles={rndHandleStyles}
                                className="bg-transparent-600 z-40"
                            >
                                {otherVideos}
                            </Rnd>
                        </div>
                    ))}
                {ourWebRtcId && displayOwnVideo && (
                    <div
                        className={
                            'absolute top-0 left-0' +
                            (webRtcIsFullscreen ? ' ml-2' : '')
                        }
                        style={{
                            marginTop: displayVertically ? '80vh' : '45vh',
                            zIndex: 41
                        }}
                    >
                        <Rnd
                            default={{
                                x: 0,
                                y: 0,
                                width: '80',
                                height: 'auto'
                            }}
                            resizeHandleStyles={rndHandleStyles}
                            className="bg-transparent-600"
                        >
                            {ownVideo}
                        </Rnd>
                    </div>
                )}
            </div>
        );
    } else if (ourWebRtcId) {
        return (
            <>
                {displayedMediaStreams.map((mediaStream) => {
                    return (
                        <audio
                            key={mediaStream.webRtcId}
                            muted={mediaStream.webRtcId === ourWebRtcId}
                            ref={(audio): void => {
                                if (audio) {
                                    if (
                                        audio.srcObject !==
                                        mediaStreamsRef.current[
                                            mediaStream.webRtcId
                                        ]
                                    ) {
                                        audio.srcObject =
                                            mediaStreamsRef.current[
                                                mediaStream.webRtcId
                                            ];
                                    }
                                }
                            }}
                            onLoadedMetadata={(event): void => {
                                event.currentTarget.play();
                            }}
                        ></audio>
                    );
                })}
            </>
        );
    } else {
        return null;
    }
}
