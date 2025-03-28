export const injectFontCSS = () => {
  if (document.getElementById('icon-font-style')) return;
  const style = document.createElement('style');
  style.id = 'icon-font-style';
  style.textContent = FONT_STYLES;
  document.head.appendChild(style);
};

const FONT_STYLES = `@font-face {
  font-family: 'sc';
  src:  url('./fonts/sc.eot?5emqtd');
  src:  url('./fonts/sc.eot?5emqtd#iefix') format('embedded-opentype'),
    url('./fonts/sc.ttf?5emqtd') format('truetype'),
    url('./fonts/sc.woff?5emqtd') format('woff'),
    url('./fonts/sc.svg?5emqtd#sc') format('svg');
  font-weight: normal;
  font-style: normal;
  font-display: block;
}

/* stylelint-disable-next-line font-family-no-missing-generic-family-keyword */
[class^="icon-"], [class*=" icon-"] {
  /* use !important to prevent issues with browser extensions that change fonts */
  font-family: 'sc', sans-serif !important;
  speak: never;
  font-style: normal;
  font-weight: normal;
  font-variant: normal;
  text-transform: none;
  line-height: 1;

  /* Better Font Rendering =========== */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.icon-zoom-out:before {
  content: "\\e900";
}
.icon-zoom-in:before {
  content: "\\e901";
}
.icon-wrench:before {
  content: "\\e902";
}
.icon-word-file:before {
  content: "\\e903";
}
.icon-vertical-layout:before {
  content: "\\e904";
}
.icon-users:before {
  content: "\\e905";
}
.icon-user:before {
  content: "\\e906";
}
.icon-upload:before {
  content: "\\e907";
}
.icon-unlock:before {
  content: "\\e908";
}
.icon-unclassified:before {
  content: "\\e909";
}
.icon-tree:before {
  content: "\\e90a";
}
.icon-trash:before {
  content: "\\e90b";
}
.icon-toolbar:before {
  content: "\\e90c";
}
.icon-todo-list:before {
  content: "\\e90d";
}
.icon-timer-sc:before {
  content: "\\e90e";
}
.icon-time:before {
  content: "\\e90f";
}
.icon-tick-mark:before {
  content: "\\e910";
}
.icon-tablet-sc:before {
  content: "\\e911";
}
.icon-tab-sc:before {
  content: "\\e912";
}
.icon-success:before {
  content: "\\e913";
}
.icon-star-o:before {
  content: "\\e914";
}
.icon-star-sc:before {
  content: "\\e915";
}
.icon-standard-chartered:before {
  content: "\\e916";
}
.icon-stack:before {
  content: "\\e917";
}
.icon-sort-top:before {
  content: "\\e918";
}
.icon-sort-down:before {
  content: "\\e919";
}
.icon-sort-sc:before {
  content: "\\e91a";
}
.icon-share-sc:before {
  content: "\\e91b";
}
.icon-settings-sc:before {
  content: "\\e91c";
}
.icon-send-sc:before {
  content: "\\e91d";
}
.icon-search-plus:before {
  content: "\\e91e";
}
.icon-search-minus:before {
  content: "\\e91f";
}
.icon-search-sc:before {
  content: "\\e920";
}
.icon-sc-icon-document:before {
  content: "\\e921";
}
.icon-scb-document:before {
  content: "\\e922";
}
.icon-scan-failure:before {
  content: "\\e923";
}
.icon-scan-cross:before {
  content: "\\e924";
}
.icon-scan-check:before {
  content: "\\e925";
}
.icon-scan:before {
  content: "\\e926";
}
.icon-right-end:before {
  content: "\\e927";
}
.icon-right-box:before {
  content: "\\e928";
}
.icon-resize:before {
  content: "\\e929";
}
.icon-repair:before {
  content: "\\e92a";
}
.icon-remote-access:before {
  content: "\\e92b";
}
.icon-refresh-sc:before {
  content: "\\e92c";
}
.icon-redo-sc:before {
  content: "\\e92d";
}
.icon-recent:before {
  content: "\\e92e";
}
.icon-question-mark-circle:before {
  content: "\\e92f";
}
.icon-question:before {
  content: "\\e930";
}
.icon-push-right:before {
  content: "\\e931";
}
.icon-pushpin:before {
  content: "\\e932";
}
.icon-push-left:before {
  content: "\\e933";
}
.icon-pdf-file:before {
  content: "\\e934";
}
.icon-plus-circle:before {
  content: "\\e935";
}
.icon-plus-box:before {
  content: "\\e936";
}
.icon-plus:before {
  content: "\\e937";
}
.icon-phone-sc:before {
  content: "\\e938";
}
.icon-pencil:before {
  content: "\\e939";
}
.icon-pause-circle:before {
  content: "\\e93b";
}
.icon-pause-sc:before {
  content: "\\e93c";
}
.icon-paste:before {
  content: "\\e93d";
}
.icon-orientation:before {
  content: "\\e93e";
}
.icon-options:before {
  content: "\\e93f";
}
.icon-multi-select:before {
  content: "\\e940";
}
.icon-multiple-user:before {
  content: "\\e941";
}
.icon-move-arrows:before {
  content: "\\e942";
}
.icon-move:before {
  content: "\\e943";
}
.icon-monitor-validation:before {
  content: "\\e944";
}
.icon-monitor-grid:before {
  content: "\\e945";
}
.icon-monitor-cross:before {
  content: "\\e946";
}
.icon-monitor-check:before {
  content: "\\e947";
}
.icon-monitor-sc:before {
  content: "\\e948";
}
.icon-modal-popup:before {
  content: "\\e949";
}
.icon-mobile:before {
  content: "\\e94a";
}
.icon-minus-circle:before {
  content: "\\e94b";
}
.icon-minus-box:before {
  content: "\\e94c";
}
.icon-minus:before {
  content: "\\e94d";
}
.icon-minimize-sc:before {
  content: "\\e94e";
}
.icon-menu-sc:before {
  content: "\\e94f";
}
.icon-maximize-sc:before {
  content: "\\e950";
}
.icon-mask-on:before {
  content: "\\e951";
}
.icon-mask:before {
  content: "\\e952";
}
.icon-manage:before {
  content: "\\e953";
}
.icon-mail:before {
  content: "\\e954";
}
.icon-logout-sc:before {
  content: "\\e955";
}
.icon-logo-minimal:before {
  content: "\\e956";
}
.icon-logo-icon:before {
  content: "\\e957";
}
.icon-logo:before {
  content: "\\e958";
}
.icon-lock:before {
  content: "\\e959";
}
.icon-link-sc:before {
  content: "\\e95a";
}
.icon-letter-pad:before {
  content: "\\e95b";
}
.icon-left-end:before {
  content: "\\e95c";
}
.icon-left-box:before {
  content: "\\e95d";
}
.icon-info-sc:before {
  content: "\\e95e";
}
.icon-import:before {
  content: "\\e95f";
}
.icon-image:before {
  content: "\\e960";
}
.icon-horizontal-layout:before {
  content: "\\e961";
}
.icon-home-sc:before {
  content: "\\e962";
}
.icon-help-sc:before {
  content: "\\e963";
}
.icon-grid:before {
  content: "\\e964";
}
.icon-globe:before {
  content: "\\e965";
}
.icon-generic:before {
  content: "\\e966";
}
.icon-gear:before {
  content: "\\e967";
}
.icon-gauge:before {
  content: "\\e968";
}
.icon-forward-sc:before {
  content: "\\e969";
}
.icon-folder-sc:before {
  content: "\\e96a";
}
.icon-finance:before {
  content: "\\e96b";
}
.icon-filter-pencil:before {
  content: "\\e96c";
}
.icon-filter-applied:before {
  content: "\\e96d";
}
.icon-filter-sc:before {
  content: "\\e96e";
}
.icon-file-word:before {
  content: "\\e96f";
}
.icon-file-preview:before {
  content: "\\e970";
}
.icon-file-plus-circle:before {
  content: "\\e971";
}
.icon-file-paste:before {
  content: "\\e972";
}
.icon-file-logo:before {
  content: "\\e973";
}
.icon-file-export:before {
  content: "\\e974";
}
.icon-file-excel:before {
  content: "\\e975";
}
.icon-file-document:before {
  content: "\\e976";
}
.icon-file-copy:before {
  content: "\\e977";
}
.icon-file-check-circle:before {
  content: "\\e978";
}
.icon-file-check:before {
  content: "\\e979";
}
.icon-file-arrow-down:before {
  content: "\\e97a";
}
.icon-file-adobe-acrobat:before {
  content: "\\e97b";
}
.icon-file:before {
  content: "\\e97c";
}
.icon-favourite-unfilled:before {
  content: "\\e97d";
}
.icon-favourite-filled:before {
  content: "\\e97e";
}
.icon-eye-slash:before {
  content: "\\e97f";
}
.icon-eye:before {
  content: "\\e980";
}
.icon-export:before {
  content: "\\e981";
}
.icon-expand-collapse:before {
  content: "\\e982";
}
.icon-expand-sc:before {
  content: "\\e983";
}
.icon-excel-file:before {
  content: "\\e984";
}
.icon-ellipsis-vertical-square:before {
  content: "\\e985";
}
.icon-ellipsis-horizontal-square:before {
  content: "\\e986";
}
.icon-dropdown-small:before {
  content: "\\e987";
}
.icon-dropdown:before {
  content: "\\e988";
}
.icon-drag-up:before {
  content: "\\e989";
}
.icon-drag-down:before {
  content: "\\e98a";
}
.icon-download:before {
  content: "\\e98b";
}
.icon-doc-upload:before {
  content: "\\e98c";
}
.icon-doc:before {
  content: "\\e98d";
}
.icon-display-validation:before {
  content: "\\e98e";
}
.icon-display-grid:before {
  content: "\\e98f";
}
.icon-disable:before {
  content: "\\e990";
}
.icon-desktop:before {
  content: "\\e991";
}
.icon-delete-sc:before {
  content: "\\e992";
}
.icon-dashboard-sc:before {
  content: "\\e993";
}
.icon-cut:before {
  content: "\\e994";
}
.icon-cross-circle:before {
  content: "\\e995";
}
.icon-cross-box:before {
  content: "\\e996";
}
.icon-cross:before {
  content: "\\e997";
}
.icon-create-new:before {
  content: "\\e998";
}
.icon-copy:before {
  content: "\\e999";
}
.icon-close:before {
  content: "\\e99a";
}
.icon-clock:before {
  content: "\\e99b";
}
.icon-classified:before {
  content: "\\e99c";
}
.icon-chevron-up:before {
  content: "\\e99d";
}
.icon-chevron-right-to-line:before {
  content: "\\e99e";
}
.icon-chevron-right-box:before {
  content: "\\e99f";
}
.icon-chevron-right:before {
  content: "\\e9a0";
}
.icon-chevron-left-to-line:before {
  content: "\\e9a1";
}
.icon-chevron-left-box:before {
  content: "\\e9a2";
}
.icon-chevron-left:before {
  content: "\\e9a3";
}
.icon-chevron-down-circle:before {
  content: "\\e9a4";
}
.icon-chevron-down:before {
  content: "\\e9a5";
}
.icon-check-circle:before {
  content: "\\e9a6";
}
.icon-check-sc:before {
  content: "\\e9a7";
}
.icon-chat-sc:before {
  content: "\\e9a8";
}
.icon-card-library:before {
  content: "\\e9a9";
}
.icon-cancel-sc:before {
  content: "\\e9aa";
}
.icon-calendar:before {
  content: "\\e9ab";
}
.icon-bookmark-sc:before {
  content: "\\e9ac";
}
.icon-bell:before {
  content: "\\e9ad";
}
.icon-batch-export:before {
  content: "\\e9ae";
}
.icon-bars:before {
  content: "\\e9af";
}
.icon-backward:before {
  content: "\\e9b0";
}
.icon-backspace-sc:before {
  content: "\\e9b1";
}
.icon-attachment-sc:before {
  content: "\\e9b2";
}
.icon-arrow-up-down:before {
  content: "\\e9b3";
}
.icon-arrow-up-box:before {
  content: "\\e9b4";
}
.icon-arrow-up-arrow-down:before {
  content: "\\e9b5";
}
.icon-arrow-right-circle:before {
  content: "\\e9b6";
}
.icon-arrow-right-box:before {
  content: "\\e9b7";
}
.icon-arrow-right:before {
  content: "\\e9b8";
}
.icon-arrow-open:before {
  content: "\\e9b9";
}
.icon-arrow-move:before {
  content: "\\e9ba";
}
.icon-arrow-left-circle:before {
  content: "\\e9bb";
}
.icon-arrow-left:before {
  content: "\\e9bc";
}
.icon-arrow-down-box:before {
  content: "\\e9bd";
}
.icon-arrow-bar-right:before {
  content: "\\e9be";
}
.icon-arrow-bar-left:before {
  content: "\\e9bf";
}
.icon-approve:before {
  content: "\\e9c0";
}
.icon-anchor-sc:before {
  content: "\\e9c1";
}
.icon-alternate:before {
  content: "\\e9c2";
}
.icon-alert:before {
  content: "\\e9c3";
}
.icon-alarm-clock:before {
  content: "\\e9c4";
}
.icon-action-forward:before {
  content: "\\e9c5";
}
.icon-action-backward:before {
  content: "\\e9c6";
}
.icon-add-circle:before {
  content: "\\e9c7";
}
.icon-error:before {
  content: "\\e9c8";
}
.icon-error_outline:before {
  content: "\\e9c9";
}
.icon-warning:before {
  content: "\\e9ca";
}
.icon-add_alert:before {
  content: "\\e9cb";
}
.icon-notification_important:before {
  content: "\\e9cc";
}
.icon-album:before {
  content: "\\e9cd";
}
.icon-av_timer:before {
  content: "\\e9ce";
}
.icon-closed_caption:before {
  content: "\\e9cf";
}
.icon-equalizer:before {
  content: "\\e9d0";
}
.icon-explicit:before {
  content: "\\e9d1";
}
.icon-fast_forward:before {
  content: "\\e9d2";
}
.icon-fast_rewind:before {
  content: "\\e9d3";
}
.icon-games:before {
  content: "\\e9d4";
}
.icon-hearing:before {
  content: "\\e9d5";
}
.icon-high_quality:before {
  content: "\\e9d6";
}
.icon-loop:before {
  content: "\\e9d7";
}
.icon-mic:before {
  content: "\\e9d8";
}
.icon-mic_none:before {
  content: "\\e9d9";
}
.icon-mic_off:before {
  content: "\\e9da";
}
.icon-movie:before {
  content: "\\e9db";
}
.icon-library_add:before {
  content: "\\e9dc";
}
.icon-library_books:before {
  content: "\\e9dd";
}
.icon-library_music:before {
  content: "\\e9de";
}
.icon-new_releases:before {
  content: "\\e9df";
}
.icon-not_interested:before {
  content: "\\e9e0";
}
.icon-pause:before {
  content: "\\e9e1";
}
.icon-pause_circle_filled:before {
  content: "\\e9e2";
}
.icon-pause_circle_outline:before {
  content: "\\e9e3";
}
.icon-play_arrow:before {
  content: "\\e9e4";
}
.icon-play_circle_filled:before {
  content: "\\e9e5";
}
.icon-play_circle_outline:before {
  content: "\\e9e6";
}
.icon-playlist_add:before {
  content: "\\e9e7";
}
.icon-queue_music:before {
  content: "\\e9e8";
}
.icon-radio:before {
  content: "\\e9e9";
}
.icon-recent_actors:before {
  content: "\\e9ea";
}
.icon-repeat:before {
  content: "\\e9eb";
}
.icon-repeat_one:before {
  content: "\\e9ec";
}
.icon-replay:before {
  content: "\\e9ed";
}
.icon-shuffle:before {
  content: "\\e9ee";
}
.icon-skip_next:before {
  content: "\\e9ef";
}
.icon-skip_previous:before {
  content: "\\e9f0";
}
.icon-snooze:before {
  content: "\\e9f1";
}
.icon-stop:before {
  content: "\\e9f2";
}
.icon-subtitles:before {
  content: "\\e9f3";
}
.icon-surround_sound:before {
  content: "\\e9f4";
}
.icon-video_library:before {
  content: "\\e9f5";
}
.icon-videocam:before {
  content: "\\e9f6";
}
.icon-videocam_off:before {
  content: "\\e9f7";
}
.icon-volume_down:before {
  content: "\\e9f8";
}
.icon-volume_mute:before {
  content: "\\e9f9";
}
.icon-volume_off:before {
  content: "\\e9fa";
}
.icon-volume_up:before {
  content: "\\e9fb";
}
.icon-web:before {
  content: "\\e9fc";
}
.icon-hd:before {
  content: "\\e9fd";
}
.icon-sort_by_alpha:before {
  content: "\\e9fe";
}
.icon-airplay:before {
  content: "\\e9ff";
}
.icon-forward_10:before {
  content: "\\ea00";
}
.icon-forward_30:before {
  content: "\\ea01";
}
.icon-forward_5:before {
  content: "\\ea02";
}
.icon-replay_10:before {
  content: "\\ea03";
}
.icon-replay_30:before {
  content: "\\ea04";
}
.icon-replay_5:before {
  content: "\\ea05";
}
.icon-add_to_queue:before {
  content: "\\ea06";
}
.icon-fiber_dvr:before {
  content: "\\ea07";
}
.icon-fiber_new:before {
  content: "\\ea08";
}
.icon-playlist_play:before {
  content: "\\ea09";
}
.icon-art_track:before {
  content: "\\ea0a";
}
.icon-fiber_manual_record:before {
  content: "\\ea0b";
}
.icon-fiber_smart_record:before {
  content: "\\ea0c";
}
.icon-music_video:before {
  content: "\\ea0d";
}
.icon-subscriptions:before {
  content: "\\ea0e";
}
.icon-playlist_add_check:before {
  content: "\\ea0f";
}
.icon-queue_play_next:before {
  content: "\\ea10";
}
.icon-remove_from_queue:before {
  content: "\\ea11";
}
.icon-slow_motion_video:before {
  content: "\\ea12";
}
.icon-web_asset:before {
  content: "\\ea13";
}
.icon-fiber_pin:before {
  content: "\\ea14";
}
.icon-branding_watermark:before {
  content: "\\ea15";
}
.icon-call_to_action:before {
  content: "\\ea16";
}
.icon-featured_play_list:before {
  content: "\\ea17";
}
.icon-featured_video:before {
  content: "\\ea18";
}
.icon-note:before {
  content: "\\ea19";
}
.icon-video_call:before {
  content: "\\ea1a";
}
.icon-video_label:before {
  content: "\\ea1b";
}
.icon-4k:before {
  content: "\\ea1c";
}
.icon-missed_video_call:before {
  content: "\\ea1d";
}
.icon-control_camera:before {
  content: "\\ea1e";
}
.icon-business:before {
  content: "\\ea1f";
}
.icon-call:before {
  content: "\\ea20";
}
.icon-call_end:before {
  content: "\\ea21";
}
.icon-call_made:before {
  content: "\\ea22";
}
.icon-call_merge:before {
  content: "\\ea23";
}
.icon-call_missed:before {
  content: "\\ea24";
}
.icon-call_received:before {
  content: "\\ea25";
}
.icon-call_split:before {
  content: "\\ea26";
}
.icon-chat:before {
  content: "\\ea27";
}
.icon-clear_all:before {
  content: "\\ea28";
}
.icon-comment:before {
  content: "\\ea29";
}
.icon-contacts:before {
  content: "\\ea2a";
}
.icon-dialer_sip:before {
  content: "\\ea2b";
}
.icon-dialpad:before {
  content: "\\ea2c";
}
.icon-email:before {
  content: "\\ea2d";
}
.icon-forum:before {
  content: "\\ea2e";
}
.icon-import_export:before {
  content: "\\ea2f";
}
.icon-invert_colors_off:before {
  content: "\\ea30";
}
.icon-live_help:before {
  content: "\\ea31";
}
.icon-location_off:before {
  content: "\\ea32";
}
.icon-location_on:before {
  content: "\\ea33";
}
.icon-message:before {
  content: "\\ea34";
}
.icon-chat_bubble:before {
  content: "\\ea35";
}
.icon-chat_bubble_outline:before {
  content: "\\ea36";
}
.icon-no_sim:before {
  content: "\\ea37";
}
.icon-phone:before {
  content: "\\ea38";
}
.icon-portable_wifi_off:before {
  content: "\\ea39";
}
.icon-contact_phone:before {
  content: "\\ea3a";
}
.icon-contact_mail:before {
  content: "\\ea3b";
}
.icon-ring_volume:before {
  content: "\\ea3c";
}
.icon-speaker_phone:before {
  content: "\\ea3d";
}
.icon-stay_current_landscape:before {
  content: "\\ea3e";
}
.icon-stay_current_portrait:before {
  content: "\\ea3f";
}
.icon-swap_calls:before {
  content: "\\ea40";
}
.icon-textsms:before {
  content: "\\ea41";
}
.icon-voicemail:before {
  content: "\\ea42";
}
.icon-vpn_key:before {
  content: "\\ea43";
}
.icon-phonelink_erase:before {
  content: "\\ea44";
}
.icon-phonelink_lock:before {
  content: "\\ea45";
}
.icon-phonelink_ring:before {
  content: "\\ea46";
}
.icon-phonelink_setup:before {
  content: "\\ea47";
}
.icon-present_to_all:before {
  content: "\\ea48";
}
.icon-import_contacts:before {
  content: "\\ea49";
}
.icon-mail_outline:before {
  content: "\\ea4a";
}
.icon-screen_share:before {
  content: "\\ea4b";
}
.icon-stop_screen_share:before {
  content: "\\ea4c";
}
.icon-call_missed_outgoing:before {
  content: "\\ea4d";
}
.icon-rss_feed:before {
  content: "\\ea4e";
}
.icon-alternate_email:before {
  content: "\\ea4f";
}
.icon-mobile_screen_share:before {
  content: "\\ea50";
}
.icon-add_call:before {
  content: "\\ea51";
}
.icon-cancel_presentation:before {
  content: "\\ea52";
}
.icon-pause_presentation:before {
  content: "\\ea53";
}
.icon-unsubscribe:before {
  content: "\\ea54";
}
.icon-cell_wifi:before {
  content: "\\ea55";
}
.icon-sentiment_satisfied_alt:before {
  content: "\\ea56";
}
.icon-list_alt:before {
  content: "\\ea57";
}
.icon-domain_disabled:before {
  content: "\\ea58";
}
.icon-lightbulb:before {
  content: "\\ea59";
}
.icon-add:before {
  content: "\\ea5a";
}
.icon-add_box:before {
  content: "\\ea5b";
}
.icon-add_circle:before {
  content: "\\ea5c";
}
.icon-add_circle_outline:before {
  content: "\\ea5d";
}
.icon-archive:before {
  content: "\\ea5e";
}
.icon-backspace:before {
  content: "\\ea5f";
}
.icon-block:before {
  content: "\\ea60";
}
.icon-clear:before {
  content: "\\ea61";
}
.icon-content_copy:before {
  content: "\\ea62";
}
.icon-content_cut:before {
  content: "\\ea63";
}
.icon-content_paste:before {
  content: "\\ea64";
}
.icon-create:before {
  content: "\\ea65";
}
.icon-drafts:before {
  content: "\\ea66";
}
.icon-filter_list:before {
  content: "\\ea67";
}
.icon-flag:before {
  content: "\\ea68";
}
.icon-forward:before {
  content: "\\ea69";
}
.icon-gesture:before {
  content: "\\ea6a";
}
.icon-inbox:before {
  content: "\\ea6b";
}
.icon-link:before {
  content: "\\ea6c";
}
.icon-redo:before {
  content: "\\ea6d";
}
.icon-remove:before {
  content: "\\ea6e";
}
.icon-remove_circle:before {
  content: "\\ea6f";
}
.icon-remove_circle_outline:before {
  content: "\\ea70";
}
.icon-reply:before {
  content: "\\ea71";
}
.icon-reply_all:before {
  content: "\\ea72";
}
.icon-report:before {
  content: "\\ea73";
}
.icon-save:before {
  content: "\\ea74";
}
.icon-select_all:before {
  content: "\\ea75";
}
.icon-send:before {
  content: "\\ea76";
}
.icon-sort:before {
  content: "\\ea77";
}
.icon-text_format:before {
  content: "\\ea78";
}
.icon-undo:before {
  content: "\\ea79";
}
.icon-font_download:before {
  content: "\\ea7a";
}
.icon-move_to_inbox:before {
  content: "\\ea7b";
}
.icon-unarchive:before {
  content: "\\ea7c";
}
.icon-next_week:before {
  content: "\\ea7d";
}
.icon-weekend:before {
  content: "\\ea7e";
}
.icon-delete_sweep:before {
  content: "\\ea7f";
}
.icon-low_priority:before {
  content: "\\ea80";
}
.icon-outlined_flag:before {
  content: "\\ea81";
}
.icon-link_off:before {
  content: "\\ea82";
}
.icon-report_off:before {
  content: "\\ea83";
}
.icon-save_alt:before {
  content: "\\ea84";
}
.icon-ballot:before {
  content: "\\ea85";
}
.icon-file_copy:before {
  content: "\\ea86";
}
.icon-how_to_reg:before {
  content: "\\ea87";
}
.icon-how_to_vote:before {
  content: "\\ea88";
}
.icon-waves:before {
  content: "\\ea89";
}
.icon-where_to_vote:before {
  content: "\\ea8a";
}
.icon-add_link:before {
  content: "\\ea8b";
}
.icon-inventory:before {
  content: "\\ea8c";
}
.icon-access_alarm:before {
  content: "\\ea8d";
}
.icon-access_alarms:before {
  content: "\\ea8e";
}
.icon-access_time:before {
  content: "\\ea8f";
}
.icon-add_alarm:before {
  content: "\\ea90";
}
.icon-airplanemode_off:before {
  content: "\\ea91";
}
.icon-airplanemode_on:before {
  content: "\\ea92";
}
.icon-battery_alert:before {
  content: "\\ea93";
}
.icon-battery_charging_full:before {
  content: "\\ea94";
}
.icon-battery_full:before {
  content: "\\ea95";
}
.icon-battery_unknown:before {
  content: "\\ea96";
}
.icon-bluetooth:before {
  content: "\\ea97";
}
.icon-bluetooth_connected:before {
  content: "\\ea98";
}
.icon-bluetooth_disabled:before {
  content: "\\ea99";
}
.icon-bluetooth_searching:before {
  content: "\\ea9a";
}
.icon-brightness_auto:before {
  content: "\\ea9b";
}
.icon-brightness_high:before {
  content: "\\ea9c";
}
.icon-brightness_low:before {
  content: "\\ea9d";
}
.icon-brightness_medium:before {
  content: "\\ea9e";
}
.icon-data_usage:before {
  content: "\\ea9f";
}
.icon-developer_mode:before {
  content: "\\eaa0";
}
.icon-devices:before {
  content: "\\eaa1";
}
.icon-dvr:before {
  content: "\\eaa2";
}
.icon-gps_fixed:before {
  content: "\\eaa3";
}
.icon-gps_not_fixed:before {
  content: "\\eaa4";
}
.icon-gps_off:before {
  content: "\\eaa5";
}
.icon-graphic_eq:before {
  content: "\\eaa6";
}
.icon-network_cell:before {
  content: "\\eaa7";
}
.icon-network_wifi:before {
  content: "\\eaa8";
}
.icon-nfc:before {
  content: "\\eaa9";
}
.icon-now_wallpaper:before {
  content: "\\eaaa";
}
.icon-now_widgets:before {
  content: "\\eaab";
}
.icon-screen_lock_landscape:before {
  content: "\\eaac";
}
.icon-screen_lock_portrait:before {
  content: "\\eaad";
}
.icon-screen_lock_rotation:before {
  content: "\\eaae";
}
.icon-screen_rotation:before {
  content: "\\eaaf";
}
.icon-sd_storage:before {
  content: "\\eab0";
}
.icon-settings_system_daydream:before {
  content: "\\eab1";
}
.icon-signal_cellular_4_bar:before {
  content: "\\eab2";
}
.icon-signal_cellular_connected_no_internet_4_bar:before {
  content: "\\eab3";
}
.icon-signal_cellular_null:before {
  content: "\\eab4";
}
.icon-signal_cellular_off:before {
  content: "\\eab5";
}
.icon-signal_wifi_4_bar:before {
  content: "\\eab6";
}
.icon-signal_wifi_4_bar_lock:before {
  content: "\\eab7";
}
.icon-signal_wifi_off:before {
  content: "\\eab8";
}
.icon-storage:before {
  content: "\\eab9";
}
.icon-usb:before {
  content: "\\eaba";
}
.icon-wifi_lock:before {
  content: "\\eabb";
}
.icon-wifi_tethering:before {
  content: "\\eabc";
}
.icon-add_to_home_screen:before {
  content: "\\eabd";
}
.icon-device_thermostat:before {
  content: "\\eabe";
}
.icon-mobile_friendly:before {
  content: "\\eabf";
}
.icon-mobile_off:before {
  content: "\\eac0";
}
.icon-signal_cellular_alt:before {
  content: "\\eac1";
}
.icon-attach_file:before {
  content: "\\eac2";
}
.icon-attach_money:before {
  content: "\\eac3";
}
.icon-border_all:before {
  content: "\\eac4";
}
.icon-border_bottom:before {
  content: "\\eac5";
}
.icon-border_clear:before {
  content: "\\eac6";
}
.icon-border_color:before {
  content: "\\eac7";
}
.icon-border_horizontal:before {
  content: "\\eac8";
}
.icon-border_inner:before {
  content: "\\eac9";
}
.icon-border_left:before {
  content: "\\eaca";
}
.icon-border_outer:before {
  content: "\\eacb";
}
.icon-border_right:before {
  content: "\\eacc";
}
.icon-border_style:before {
  content: "\\eacd";
}
.icon-border_top:before {
  content: "\\eace";
}
.icon-border_vertical:before {
  content: "\\eacf";
}
.icon-format_align_center:before {
  content: "\\ead0";
}
.icon-format_align_justify:before {
  content: "\\ead1";
}
.icon-format_align_left:before {
  content: "\\ead2";
}
.icon-format_align_right:before {
  content: "\\ead3";
}
.icon-format_bold:before {
  content: "\\ead4";
}
.icon-format_clear:before {
  content: "\\ead5";
}
.icon-format_color_fill:before {
  content: "\\ead6";
}
.icon-format_color_reset:before {
  content: "\\ead7";
}
.icon-format_color_text:before {
  content: "\\ead8";
}
.icon-format_indent_decrease:before {
  content: "\\ead9";
}
.icon-format_indent_increase:before {
  content: "\\eada";
}
.icon-format_italic:before {
  content: "\\eadb";
}
.icon-format_line_spacing:before {
  content: "\\eadc";
}
.icon-format_list_bulleted:before {
  content: "\\eadd";
}
.icon-format_list_numbered:before {
  content: "\\eade";
}
.icon-format_paint:before {
  content: "\\eadf";
}
.icon-format_quote:before {
  content: "\\eae0";
}
.icon-format_size:before {
  content: "\\eae1";
}
.icon-format_strikethrough:before {
  content: "\\eae2";
}
.icon-format_textdirection_l_to_r:before {
  content: "\\eae3";
}
.icon-format_textdirection_r_to_l:before {
  content: "\\eae4";
}
.icon-format_underlined:before {
  content: "\\eae5";
}
.icon-functions:before {
  content: "\\eae6";
}
.icon-insert_chart:before {
  content: "\\eae7";
}
.icon-insert_comment:before {
  content: "\\eae8";
}
.icon-insert_drive_file:before {
  content: "\\eae9";
}
.icon-insert_emoticon:before {
  content: "\\eaea";
}
.icon-insert_invitation:before {
  content: "\\eaeb";
}
.icon-insert_photo:before {
  content: "\\eaec";
}
.icon-mode_comment:before {
  content: "\\eaed";
}
.icon-publish:before {
  content: "\\eaee";
}
.icon-space_bar:before {
  content: "\\eaef";
}
.icon-strikethrough_s:before {
  content: "\\eaf0";
}
.icon-vertical_align_bottom:before {
  content: "\\eaf1";
}
.icon-vertical_align_center:before {
  content: "\\eaf2";
}
.icon-vertical_align_top:before {
  content: "\\eaf3";
}
.icon-wrap_text:before {
  content: "\\eaf4";
}
.icon-money_off:before {
  content: "\\eaf5";
}
.icon-drag_handle:before {
  content: "\\eaf6";
}
.icon-format_shapes:before {
  content: "\\eaf7";
}
.icon-highlight:before {
  content: "\\eaf8";
}
.icon-linear_scale:before {
  content: "\\eaf9";
}
.icon-short_text:before {
  content: "\\eafa";
}
.icon-text_fields:before {
  content: "\\eafb";
}
.icon-monetization_on:before {
  content: "\\eafc";
}
.icon-title:before {
  content: "\\eafd";
}
.icon-table_chart:before {
  content: "\\eafe";
}
.icon-add_comment:before {
  content: "\\eaff";
}
.icon-format_list_numbered_rtl:before {
  content: "\\eb00";
}
.icon-scatter_plot:before {
  content: "\\eb01";
}
.icon-score:before {
  content: "\\eb02";
}
.icon-insert_chart_outlined:before {
  content: "\\eb03";
}
.icon-bar_chart:before {
  content: "\\eb04";
}
.icon-notes:before {
  content: "\\eb05";
}
.icon-attachment:before {
  content: "\\eb06";
}
.icon-cloud:before {
  content: "\\eb07";
}
.icon-cloud_circle:before {
  content: "\\eb08";
}
.icon-cloud_done:before {
  content: "\\eb09";
}
.icon-cloud_download:before {
  content: "\\eb0a";
}
.icon-cloud_off:before {
  content: "\\eb0b";
}
.icon-cloud_queue:before {
  content: "\\eb0c";
}
.icon-cloud_upload:before {
  content: "\\eb0d";
}
.icon-file_download:before {
  content: "\\eb0e";
}
.icon-file_upload:before {
  content: "\\eb0f";
}
.icon-folder:before {
  content: "\\eb10";
}
.icon-folder_open:before {
  content: "\\eb11";
}
.icon-folder_shared:before {
  content: "\\eb12";
}
.icon-create_new_folder:before {
  content: "\\eb13";
}
.icon-cast:before {
  content: "\\eb14";
}
.icon-cast_connected:before {
  content: "\\eb15";
}
.icon-computer:before {
  content: "\\eb16";
}
.icon-desktop_mac:before {
  content: "\\eb17";
}
.icon-desktop_windows:before {
  content: "\\eb18";
}
.icon-developer_board:before {
  content: "\\eb19";
}
.icon-dock:before {
  content: "\\eb1a";
}
.icon-headset:before {
  content: "\\eb1b";
}
.icon-headset_mic:before {
  content: "\\eb1c";
}
.icon-keyboard:before {
  content: "\\eb1d";
}
.icon-keyboard_arrow_down:before {
  content: "\\eb1e";
}
.icon-keyboard_arrow_left:before {
  content: "\\eb1f";
}
.icon-keyboard_arrow_right:before {
  content: "\\eb20";
}
.icon-keyboard_arrow_up:before {
  content: "\\eb21";
}
.icon-keyboard_backspace:before {
  content: "\\eb22";
}
.icon-keyboard_capslock:before {
  content: "\\eb23";
}
.icon-keyboard_hide:before {
  content: "\\eb24";
}
.icon-keyboard_return:before {
  content: "\\eb25";
}
.icon-keyboard_tab:before {
  content: "\\eb26";
}
.icon-keyboard_voice:before {
  content: "\\eb27";
}
.icon-laptop_chromebook:before {
  content: "\\eb28";
}
.icon-laptop_mac:before {
  content: "\\eb29";
}
.icon-laptop_windows:before {
  content: "\\eb2a";
}
.icon-memory:before {
  content: "\\eb2b";
}
.icon-mouse:before {
  content: "\\eb2c";
}
.icon-phone_android:before {
  content: "\\eb2d";
}
.icon-phone_iphone:before {
  content: "\\eb2e";
}
.icon-phonelink_off:before {
  content: "\\eb2f";
}
.icon-router:before {
  content: "\\eb30";
}
.icon-scanner:before {
  content: "\\eb31";
}
.icon-security:before {
  content: "\\eb32";
}
.icon-sim_card:before {
  content: "\\eb33";
}
.icon-speaker:before {
  content: "\\eb34";
}
.icon-speaker_group:before {
  content: "\\eb35";
}
.icon-tablet:before {
  content: "\\eb36";
}
.icon-tablet_android:before {
  content: "\\eb37";
}
.icon-tablet_mac:before {
  content: "\\eb38";
}
.icon-toys:before {
  content: "\\eb39";
}
.icon-tv:before {
  content: "\\eb3a";
}
.icon-watch:before {
  content: "\\eb3b";
}
.icon-device_hub:before {
  content: "\\eb3c";
}
.icon-power_input:before {
  content: "\\eb3d";
}
.icon-devices_other:before {
  content: "\\eb3e";
}
.icon-videogame_asset:before {
  content: "\\eb3f";
}
.icon-device_unknown:before {
  content: "\\eb40";
}
.icon-headset_off:before {
  content: "\\eb41";
}
.icon-adjust:before {
  content: "\\eb42";
}
.icon-assistant:before {
  content: "\\eb43";
}
.icon-audiotrack:before {
  content: "\\eb44";
}
.icon-blur_circular:before {
  content: "\\eb45";
}
.icon-blur_linear:before {
  content: "\\eb46";
}
.icon-blur_off:before {
  content: "\\eb47";
}
.icon-blur_on:before {
  content: "\\eb48";
}
.icon-brightness_1:before {
  content: "\\eb49";
}
.icon-brightness_2:before {
  content: "\\eb4a";
}
.icon-brightness_3:before {
  content: "\\eb4b";
}
.icon-brightness_4:before {
  content: "\\eb4c";
}
.icon-broken_image:before {
  content: "\\eb4d";
}
.icon-brush:before {
  content: "\\eb4e";
}
.icon-camera:before {
  content: "\\eb4f";
}
.icon-camera_alt:before {
  content: "\\eb50";
}
.icon-camera_front:before {
  content: "\\eb51";
}
.icon-camera_rear:before {
  content: "\\eb52";
}
.icon-camera_roll:before {
  content: "\\eb53";
}
.icon-center_focus_strong:before {
  content: "\\eb54";
}
.icon-center_focus_weak:before {
  content: "\\eb55";
}
.icon-collections:before {
  content: "\\eb56";
}
.icon-color_lens:before {
  content: "\\eb57";
}
.icon-colorize:before {
  content: "\\eb58";
}
.icon-compare:before {
  content: "\\eb59";
}
.icon-control_point_duplicate:before {
  content: "\\eb5a";
}
.icon-crop_16_9:before {
  content: "\\eb5b";
}
.icon-crop_3_2:before {
  content: "\\eb5c";
}
.icon-crop:before {
  content: "\\eb5d";
}
.icon-crop_5_4:before {
  content: "\\eb5e";
}
.icon-crop_7_5:before {
  content: "\\eb5f";
}
.icon-crop_din:before {
  content: "\\eb60";
}
.icon-crop_free:before {
  content: "\\eb61";
}
.icon-crop_original:before {
  content: "\\eb62";
}
.icon-crop_portrait:before {
  content: "\\eb63";
}
.icon-crop_square:before {
  content: "\\eb64";
}
.icon-dehaze:before {
  content: "\\eb65";
}
.icon-details:before {
  content: "\\eb66";
}
.icon-exposure:before {
  content: "\\eb67";
}
.icon-exposure_neg_1:before {
  content: "\\eb68";
}
.icon-exposure_neg_2:before {
  content: "\\eb69";
}
.icon-exposure_plus_1:before {
  content: "\\eb6a";
}
.icon-exposure_plus_2:before {
  content: "\\eb6b";
}
.icon-exposure_zero:before {
  content: "\\eb6c";
}
.icon-filter_1:before {
  content: "\\eb6d";
}
.icon-filter_2:before {
  content: "\\eb6e";
}
.icon-filter_3:before {
  content: "\\eb6f";
}
.icon-filter:before {
  content: "\\eb70";
}
.icon-filter_4:before {
  content: "\\eb71";
}
.icon-filter_5:before {
  content: "\\eb72";
}
.icon-filter_6:before {
  content: "\\eb73";
}
.icon-filter_7:before {
  content: "\\eb74";
}
.icon-filter_8:before {
  content: "\\eb75";
}
.icon-filter_9:before {
  content: "\\eb76";
}
.icon-filter_9_plus:before {
  content: "\\eb77";
}
.icon-filter_b_and_w:before {
  content: "\\eb78";
}
.icon-filter_center_focus:before {
  content: "\\eb79";
}
.icon-filter_drama:before {
  content: "\\eb7a";
}
.icon-filter_frames:before {
  content: "\\eb7b";
}
.icon-filter_hdr:before {
  content: "\\eb7c";
}
.icon-filter_none:before {
  content: "\\eb7d";
}
.icon-filter_tilt_shift:before {
  content: "\\eb7e";
}
.icon-filter_vintage:before {
  content: "\\eb7f";
}
.icon-flare:before {
  content: "\\eb80";
}
.icon-flash_auto:before {
  content: "\\eb81";
}
.icon-flash_off:before {
  content: "\\eb82";
}
.icon-flash_on:before {
  content: "\\eb83";
}
.icon-flip:before {
  content: "\\eb84";
}
.icon-gradient:before {
  content: "\\eb85";
}
.icon-grain:before {
  content: "\\eb86";
}
.icon-grid_off:before {
  content: "\\eb87";
}
.icon-grid_on:before {
  content: "\\eb88";
}
.icon-hdr_off:before {
  content: "\\eb89";
}
.icon-hdr_on:before {
  content: "\\eb8a";
}
.icon-hdr_strong:before {
  content: "\\eb8b";
}
.icon-hdr_weak:before {
  content: "\\eb8c";
}
.icon-healing:before {
  content: "\\eb8d";
}
.icon-image_aspect_ratio:before {
  content: "\\eb8e";
}
.icon-iso:before {
  content: "\\eb8f";
}
.icon-leak_add:before {
  content: "\\eb90";
}
.icon-leak_remove:before {
  content: "\\eb91";
}
.icon-lens:before {
  content: "\\eb92";
}
.icon-looks_3:before {
  content: "\\eb93";
}
.icon-looks:before {
  content: "\\eb94";
}
.icon-looks_4:before {
  content: "\\eb95";
}
.icon-looks_5:before {
  content: "\\eb96";
}
.icon-looks_6:before {
  content: "\\eb97";
}
.icon-looks_one:before {
  content: "\\eb98";
}
.icon-looks_two:before {
  content: "\\eb99";
}
.icon-loupe:before {
  content: "\\eb9a";
}
.icon-monochrome_photos:before {
  content: "\\eb9b";
}
.icon-music_note:before {
  content: "\\eb9c";
}
.icon-nature:before {
  content: "\\eb9d";
}
.icon-nature_people:before {
  content: "\\eb9e";
}
.icon-navigate_before:before {
  content: "\\eb9f";
}
.icon-navigate_next:before {
  content: "\\eba0";
}
.icon-panorama:before {
  content: "\\eba1";
}
.icon-panorama_fisheye:before {
  content: "\\eba2";
}
.icon-panorama_horizontal:before {
  content: "\\eba3";
}
.icon-panorama_vertical:before {
  content: "\\eba4";
}
.icon-panorama_wide_angle:before {
  content: "\\eba5";
}
.icon-photo_album:before {
  content: "\\eba6";
}
.icon-picture_as_pdf:before {
  content: "\\eba7";
}
.icon-portrait:before {
  content: "\\eba8";
}
.icon-remove_red_eye:before {
  content: "\\eba9";
}
.icon-rotate_90_degrees_ccw:before {
  content: "\\ebaa";
}
.icon-rotate_left:before {
  content: "\\ebab";
}
.icon-rotate_right:before {
  content: "\\ebac";
}
.icon-slideshow:before {
  content: "\\ebad";
}
.icon-straighten:before {
  content: "\\ebae";
}
.icon-style:before {
  content: "\\ebaf";
}
.icon-switch_camera:before {
  content: "\\ebb0";
}
.icon-switch_video:before {
  content: "\\ebb1";
}
.icon-texture:before {
  content: "\\ebb2";
}
.icon-timelapse:before {
  content: "\\ebb3";
}
.icon-timer_10:before {
  content: "\\ebb4";
}
.icon-timer_3:before {
  content: "\\ebb5";
}
.icon-timer:before {
  content: "\\ebb6";
}
.icon-timer_off:before {
  content: "\\ebb7";
}
.icon-tonality:before {
  content: "\\ebb8";
}
.icon-transform:before {
  content: "\\ebb9";
}
.icon-tune:before {
  content: "\\ebba";
}
.icon-view_comfy:before {
  content: "\\ebbb";
}
.icon-view_compact:before {
  content: "\\ebbc";
}
.icon-wb_auto:before {
  content: "\\ebbd";
}
.icon-wb_cloudy:before {
  content: "\\ebbe";
}
.icon-wb_incandescent:before {
  content: "\\ebbf";
}
.icon-wb_sunny:before {
  content: "\\ebc0";
}
.icon-collections_bookmark:before {
  content: "\\ebc1";
}
.icon-photo_size_select_actual:before {
  content: "\\ebc2";
}
.icon-photo_size_select_large:before {
  content: "\\ebc3";
}
.icon-photo_size_select_small:before {
  content: "\\ebc4";
}
.icon-vignette:before {
  content: "\\ebc5";
}
.icon-wb_iridescent:before {
  content: "\\ebc6";
}
.icon-crop_rotate:before {
  content: "\\ebc7";
}
.icon-linked_camera:before {
  content: "\\ebc8";
}
.icon-add_a_photo:before {
  content: "\\ebc9";
}
.icon-movie_filter:before {
  content: "\\ebca";
}
.icon-photo_filter:before {
  content: "\\ebcb";
}
.icon-burst_mode:before {
  content: "\\ebcc";
}
.icon-shutter_speed:before {
  content: "\\ebcd";
}
.icon-add_photo_alternate:before {
  content: "\\ebce";
}
.icon-image_search:before {
  content: "\\ebcf";
}
.icon-music_off:before {
  content: "\\ebd0";
}
.icon-beenhere:before {
  content: "\\ebd1";
}
.icon-directions:before {
  content: "\\ebd2";
}
.icon-directions_bike:before {
  content: "\\ebd3";
}
.icon-directions_bus:before {
  content: "\\ebd4";
}
.icon-directions_car:before {
  content: "\\ebd5";
}
.icon-directions_ferry:before {
  content: "\\ebd6";
}
.icon-directions_subway:before {
  content: "\\ebd7";
}
.icon-directions_train:before {
  content: "\\ebd8";
}
.icon-directions_walk:before {
  content: "\\ebd9";
}
.icon-hotel:before {
  content: "\\ebda";
}
.icon-layers:before {
  content: "\\ebdb";
}
.icon-layers_clear:before {
  content: "\\ebdc";
}
.icon-local_atm:before {
  content: "\\ebdd";
}
.icon-local_attraction:before {
  content: "\\ebde";
}
.icon-local_bar:before {
  content: "\\ebdf";
}
.icon-local_cafe:before {
  content: "\\ebe0";
}
.icon-local_car_wash:before {
  content: "\\ebe1";
}
.icon-local_convenience_store:before {
  content: "\\ebe2";
}
.icon-local_drink:before {
  content: "\\ebe3";
}
.icon-local_florist:before {
  content: "\\ebe4";
}
.icon-local_gas_station:before {
  content: "\\ebe5";
}
.icon-local_grocery_store:before {
  content: "\\ebe6";
}
.icon-local_hospital:before {
  content: "\\ebe7";
}
.icon-local_laundry_service:before {
  content: "\\ebe8";
}
.icon-local_library:before {
  content: "\\ebe9";
}
.icon-local_mall:before {
  content: "\\ebea";
}
.icon-local_movies:before {
  content: "\\ebeb";
}
.icon-local_offer:before {
  content: "\\ebec";
}
.icon-local_parking:before {
  content: "\\ebed";
}
.icon-local_pharmacy:before {
  content: "\\ebee";
}
.icon-local_pizza:before {
  content: "\\ebef";
}
.icon-local_printshop:before {
  content: "\\ebf0";
}
.icon-local_restaurant:before {
  content: "\\ebf1";
}
.icon-local_shipping:before {
  content: "\\ebf2";
}
.icon-local_taxi:before {
  content: "\\ebf3";
}
.icon-location_history:before {
  content: "\\ebf4";
}
.icon-map:before {
  content: "\\ebf5";
}
.icon-navigation:before {
  content: "\\ebf6";
}
.icon-pin_drop:before {
  content: "\\ebf7";
}
.icon-rate_review:before {
  content: "\\ebf8";
}
.icon-satellite:before {
  content: "\\ebf9";
}
.icon-store_mall_directory:before {
  content: "\\ebfa";
}
.icon-traffic:before {
  content: "\\ebfb";
}
.icon-directions_run:before {
  content: "\\ebfc";
}
.icon-add_location:before {
  content: "\\ebfd";
}
.icon-edit_location:before {
  content: "\\ebfe";
}
.icon-near_me:before {
  content: "\\ebff";
}
.icon-person_pin_circle:before {
  content: "\\ec00";
}
.icon-zoom_out_map:before {
  content: "\\ec01";
}
.icon-restaurant:before {
  content: "\\ec02";
}
.icon-ev_station:before {
  content: "\\ec03";
}
.icon-streetview:before {
  content: "\\ec04";
}
.icon-subway:before {
  content: "\\ec05";
}
.icon-train:before {
  content: "\\ec06";
}
.icon-tram:before {
  content: "\\ec07";
}
.icon-transfer_within_a_station:before {
  content: "\\ec08";
}
.icon-atm:before {
  content: "\\ec09";
}
.icon-category:before {
  content: "\\ec0a";
}
.icon-not_listed_location:before {
  content: "\\ec0b";
}
.icon-departure_board:before {
  content: "\\ec0c";
}
.icon-360:before {
  content: "\\ec0d";
}
.icon-edit_attributes:before {
  content: "\\ec0e";
}
.icon-transit_enterexit:before {
  content: "\\ec0f";
}
.icon-fastfood:before {
  content: "\\ec10";
}
.icon-trip_origin:before {
  content: "\\ec11";
}
.icon-compass_calibration:before {
  content: "\\ec12";
}
.icon-money:before {
  content: "\\ec13";
}
.icon-apps:before {
  content: "\\ec14";
}
.icon-arrow_back:before {
  content: "\\ec15";
}
.icon-arrow_drop_down:before {
  content: "\\ec16";
}
.icon-arrow_drop_down_circle:before {
  content: "\\ec17";
}
.icon-arrow_drop_up:before {
  content: "\\ec18";
}
.icon-arrow_forward:before {
  content: "\\ec19";
}
.icon-cancel:before {
  content: "\\ec1a";
}
.icon-check:before {
  content: "\\ec1b";
}
.icon-expand_less:before {
  content: "\\ec1c";
}
.icon-expand_more:before {
  content: "\\ec1d";
}
.icon-fullscreen:before {
  content: "\\ec1e";
}
.icon-fullscreen_exit:before {
  content: "\\ec1f";
}
.icon-menu:before {
  content: "\\ec20";
}
.icon-keyboard_control:before {
  content: "\\ec21";
}
.icon-more_vert:before {
  content: "\\ec22";
}
.icon-refresh:before {
  content: "\\ec23";
}
.icon-unfold_less:before {
  content: "\\ec24";
}
.icon-unfold_more:before {
  content: "\\ec25";
}
.icon-arrow_upward:before {
  content: "\\ec26";
}
.icon-subdirectory_arrow_left:before {
  content: "\\ec27";
}
.icon-subdirectory_arrow_right:before {
  content: "\\ec28";
}
.icon-arrow_downward:before {
  content: "\\ec29";
}
.icon-first_page:before {
  content: "\\ec2a";
}
.icon-last_page:before {
  content: "\\ec2b";
}
.icon-arrow_left:before {
  content: "\\ec2c";
}
.icon-arrow_right:before {
  content: "\\ec2d";
}
.icon-arrow_back_ios:before {
  content: "\\ec2e";
}
.icon-arrow_forward_ios:before {
  content: "\\ec2f";
}
.icon-adb:before {
  content: "\\ec30";
}
.icon-disc_full:before {
  content: "\\ec31";
}
.icon-do_not_disturb_alt:before {
  content: "\\ec32";
}
.icon-drive_eta:before {
  content: "\\ec33";
}
.icon-event_available:before {
  content: "\\ec34";
}
.icon-event_busy:before {
  content: "\\ec35";
}
.icon-event_note:before {
  content: "\\ec36";
}
.icon-folder_special:before {
  content: "\\ec37";
}
.icon-mms:before {
  content: "\\ec38";
}
.icon-more:before {
  content: "\\ec39";
}
.icon-network_locked:before {
  content: "\\ec3a";
}
.icon-phone_bluetooth_speaker:before {
  content: "\\ec3b";
}
.icon-phone_forwarded:before {
  content: "\\ec3c";
}
.icon-phone_in_talk:before {
  content: "\\ec3d";
}
.icon-phone_locked:before {
  content: "\\ec3e";
}
.icon-phone_missed:before {
  content: "\\ec3f";
}
.icon-phone_paused:before {
  content: "\\ec40";
}
.icon-sim_card_alert:before {
  content: "\\ec41";
}
.icon-sms_failed:before {
  content: "\\ec42";
}
.icon-sync_disabled:before {
  content: "\\ec43";
}
.icon-sync_problem:before {
  content: "\\ec44";
}
.icon-system_update:before {
  content: "\\ec45";
}
.icon-tap_and_play:before {
  content: "\\ec46";
}
.icon-vibration:before {
  content: "\\ec47";
}
.icon-voice_chat:before {
  content: "\\ec48";
}
.icon-vpn_lock:before {
  content: "\\ec49";
}
.icon-airline_seat_flat:before {
  content: "\\ec4a";
}
.icon-airline_seat_flat_angled:before {
  content: "\\ec4b";
}
.icon-airline_seat_individual_suite:before {
  content: "\\ec4c";
}
.icon-airline_seat_legroom_extra:before {
  content: "\\ec4d";
}
.icon-airline_seat_legroom_normal:before {
  content: "\\ec4e";
}
.icon-airline_seat_legroom_reduced:before {
  content: "\\ec4f";
}
.icon-airline_seat_recline_extra:before {
  content: "\\ec50";
}
.icon-airline_seat_recline_normal:before {
  content: "\\ec51";
}
.icon-confirmation_number:before {
  content: "\\ec52";
}
.icon-live_tv:before {
  content: "\\ec53";
}
.icon-ondemand_video:before {
  content: "\\ec54";
}
.icon-personal_video:before {
  content: "\\ec55";
}
.icon-power:before {
  content: "\\ec56";
}
.icon-wc:before {
  content: "\\ec57";
}
.icon-wifi:before {
  content: "\\ec58";
}
.icon-enhanced_encryption:before {
  content: "\\ec59";
}
.icon-network_check:before {
  content: "\\ec5a";
}
.icon-no_encryption:before {
  content: "\\ec5b";
}
.icon-rv_hookup:before {
  content: "\\ec5c";
}
.icon-do_not_disturb_off:before {
  content: "\\ec5d";
}
.icon-priority_high:before {
  content: "\\ec5e";
}
.icon-power_off:before {
  content: "\\ec5f";
}
.icon-tv_off:before {
  content: "\\ec60";
}
.icon-wifi_off:before {
  content: "\\ec61";
}
.icon-phone_callback:before {
  content: "\\ec62";
}
.icon-pie_chart:before {
  content: "\\ec63";
}
.icon-pie_chart_outlined:before {
  content: "\\ec64";
}
.icon-bubble_chart:before {
  content: "\\ec65";
}
.icon-multiline_chart:before {
  content: "\\ec66";
}
.icon-show_chart:before {
  content: "\\ec67";
}
.icon-cake:before {
  content: "\\ec68";
}
.icon-group:before {
  content: "\\ec69";
}
.icon-group_add:before {
  content: "\\ec6a";
}
.icon-location_city:before {
  content: "\\ec6b";
}
.icon-mood_bad:before {
  content: "\\ec6c";
}
.icon-notifications:before {
  content: "\\ec6d";
}
.icon-notifications_none:before {
  content: "\\ec6e";
}
.icon-notifications_off:before {
  content: "\\ec6f";
}
.icon-notifications_on:before {
  content: "\\ec70";
}
.icon-notifications_paused:before {
  content: "\\ec71";
}
.icon-pages:before {
  content: "\\ec72";
}
.icon-party_mode:before {
  content: "\\ec73";
}
.icon-people_outline:before {
  content: "\\ec74";
}
.icon-person:before {
  content: "\\ec75";
}
.icon-person_add:before {
  content: "\\ec76";
}
.icon-person_outline:before {
  content: "\\ec77";
}
.icon-plus_one:before {
  content: "\\ec78";
}
.icon-public:before {
  content: "\\ec79";
}
.icon-school:before {
  content: "\\ec7a";
}
.icon-share:before {
  content: "\\ec7b";
}
.icon-whatshot:before {
  content: "\\ec7c";
}
.icon-sentiment_dissatisfied:before {
  content: "\\ec7d";
}
.icon-sentiment_neutral:before {
  content: "\\ec7e";
}
.icon-sentiment_satisfied:before {
  content: "\\ec7f";
}
.icon-sentiment_very_dissatisfied:before {
  content: "\\ec80";
}
.icon-sentiment_very_satisfied:before {
  content: "\\ec81";
}
.icon-thumb_down_alt:before {
  content: "\\ec82";
}
.icon-thumb_up_alt:before {
  content: "\\ec83";
}
.icon-check_box:before {
  content: "\\ec84";
}
.icon-check_box_outline_blank:before {
  content: "\\ec85";
}
.icon-radio_button_on:before {
  content: "\\ec86";
}
.icon-star:before {
  content: "\\ec87";
}
.icon-star_half:before {
  content: "\\ec88";
}
.icon-star_outline:before {
  content: "\\ec89";
}
.icon-3d_rotation:before {
  content: "\\ec8a";
}
.icon-accessibility:before {
  content: "\\ec8b";
}
.icon-account_balance:before {
  content: "\\ec8c";
}
.icon-account_balance_wallet:before {
  content: "\\ec8d";
}
.icon-account_box:before {
  content: "\\ec8e";
}
.icon-account_circle:before {
  content: "\\ec8f";
}
.icon-add_shopping_cart:before {
  content: "\\ec90";
}
.icon-alarm_off:before {
  content: "\\ec91";
}
.icon-alarm_on:before {
  content: "\\ec92";
}
.icon-android:before {
  content: "\\ec93";
}
.icon-announcement:before {
  content: "\\ec94";
}
.icon-aspect_ratio:before {
  content: "\\ec95";
}
.icon-assignment:before {
  content: "\\ec96";
}
.icon-assignment_ind:before {
  content: "\\ec97";
}
.icon-assignment_late:before {
  content: "\\ec98";
}
.icon-assignment_return:before {
  content: "\\ec99";
}
.icon-assignment_returned:before {
  content: "\\ec9a";
}
.icon-assignment_turned_in:before {
  content: "\\ec9b";
}
.icon-autorenew:before {
  content: "\\ec9c";
}
.icon-book:before {
  content: "\\ec9d";
}
.icon-bookmark:before {
  content: "\\ec9e";
}
.icon-bookmark_outline:before {
  content: "\\ec9f";
}
.icon-bug_report:before {
  content: "\\eca0";
}
.icon-build:before {
  content: "\\eca1";
}
.icon-cached:before {
  content: "\\eca2";
}
.icon-change_history:before {
  content: "\\eca3";
}
.icon-check_circle:before {
  content: "\\eca4";
}
.icon-chrome_reader_mode:before {
  content: "\\eca5";
}
.icon-code:before {
  content: "\\eca6";
}
.icon-credit_card:before {
  content: "\\eca7";
}
.icon-dashboard:before {
  content: "\\eca8";
}
.icon-delete:before {
  content: "\\eca9";
}
.icon-description:before {
  content: "\\ecaa";
}
.icon-dns:before {
  content: "\\ecab";
}
.icon-done:before {
  content: "\\ecac";
}
.icon-done_all:before {
  content: "\\ecad";
}
.icon-exit_to_app:before {
  content: "\\ecae";
}
.icon-explore:before {
  content: "\\ecaf";
}
.icon-extension:before {
  content: "\\ecb0";
}
.icon-face:before {
  content: "\\ecb1";
}
.icon-favorite:before {
  content: "\\ecb2";
}
.icon-favorite_outline:before {
  content: "\\ecb3";
}
.icon-find_in_page:before {
  content: "\\ecb4";
}
.icon-find_replace:before {
  content: "\\ecb5";
}
.icon-flip_to_back:before {
  content: "\\ecb6";
}
.icon-flip_to_front:before {
  content: "\\ecb7";
}
.icon-group_work:before {
  content: "\\ecb8";
}
.icon-help:before {
  content: "\\ecb9";
}
.icon-highlight_remove:before {
  content: "\\ecba";
}
.icon-history:before {
  content: "\\ecbb";
}
.icon-home:before {
  content: "\\ecbc";
}
.icon-hourglass_empty:before {
  content: "\\ecbd";
}
.icon-hourglass_full:before {
  content: "\\ecbe";
}
.icon-https:before {
  content: "\\ecbf";
}
.icon-info:before {
  content: "\\ecc0";
}
.icon-info_outline:before {
  content: "\\ecc1";
}
.icon-input:before {
  content: "\\ecc2";
}
.icon-invert_colors_on:before {
  content: "\\ecc3";
}
.icon-label:before {
  content: "\\ecc4";
}
.icon-label_outline:before {
  content: "\\ecc5";
}
.icon-language:before {
  content: "\\ecc6";
}
.icon-launch:before {
  content: "\\ecc7";
}
.icon-list:before {
  content: "\\ecc8";
}
.icon-lock_open:before {
  content: "\\ecc9";
}
.icon-lock_outline:before {
  content: "\\ecca";
}
.icon-loyalty:before {
  content: "\\eccb";
}
.icon-markunread_mailbox:before {
  content: "\\eccc";
}
.icon-note_add:before {
  content: "\\eccd";
}
.icon-open_in_browser:before {
  content: "\\ecce";
}
.icon-open_with:before {
  content: "\\eccf";
}
.icon-pageview:before {
  content: "\\ecd0";
}
.icon-perm_camera_mic:before {
  content: "\\ecd1";
}
.icon-perm_contact_calendar:before {
  content: "\\ecd2";
}
.icon-perm_data_setting:before {
  content: "\\ecd3";
}
.icon-perm_device_information:before {
  content: "\\ecd4";
}
.icon-perm_media:before {
  content: "\\ecd5";
}
.icon-perm_phone_msg:before {
  content: "\\ecd6";
}
.icon-perm_scan_wifi:before {
  content: "\\ecd7";
}
.icon-picture_in_picture:before {
  content: "\\ecd8";
}
.icon-polymer:before {
  content: "\\ecd9";
}
.icon-power_settings_new:before {
  content: "\\ecda";
}
.icon-receipt:before {
  content: "\\ecdb";
}
.icon-redeem:before {
  content: "\\ecdc";
}
.icon-search:before {
  content: "\\ecdd";
}
.icon-settings:before {
  content: "\\ecde";
}
.icon-settings_applications:before {
  content: "\\ecdf";
}
.icon-settings_backup_restore:before {
  content: "\\ece0";
}
.icon-settings_bluetooth:before {
  content: "\\ece1";
}
.icon-settings_cell:before {
  content: "\\ece2";
}
.icon-settings_display:before {
  content: "\\ece3";
}
.icon-settings_ethernet:before {
  content: "\\ece4";
}
.icon-settings_input_antenna:before {
  content: "\\ece5";
}
.icon-settings_input_component:before {
  content: "\\ece6";
}
.icon-settings_input_hdmi:before {
  content: "\\ece7";
}
.icon-settings_input_svideo:before {
  content: "\\ece8";
}
.icon-settings_overscan:before {
  content: "\\ece9";
}
.icon-settings_phone:before {
  content: "\\ecea";
}
.icon-settings_power:before {
  content: "\\eceb";
}
.icon-settings_remote:before {
  content: "\\ecec";
}
.icon-settings_voice:before {
  content: "\\eced";
}
.icon-shop:before {
  content: "\\ecee";
}
.icon-shop_two:before {
  content: "\\ecef";
}
.icon-shopping_basket:before {
  content: "\\ecf0";
}
.icon-speaker_notes:before {
  content: "\\ecf1";
}
.icon-spellcheck:before {
  content: "\\ecf2";
}
.icon-stars:before {
  content: "\\ecf3";
}
.icon-subject:before {
  content: "\\ecf4";
}
.icon-supervisor_account:before {
  content: "\\ecf5";
}
.icon-swap_horiz:before {
  content: "\\ecf6";
}
.icon-swap_vert:before {
  content: "\\ecf7";
}
.icon-swap_vertical_circle:before {
  content: "\\ecf8";
}
.icon-system_update_tv:before {
  content: "\\ecf9";
}
.icon-tab:before {
  content: "\\ecfa";
}
.icon-tab_unselected:before {
  content: "\\ecfb";
}
.icon-thumb_down:before {
  content: "\\ecfc";
}
.icon-thumb_up:before {
  content: "\\ecfd";
}
.icon-thumbs_up_down:before {
  content: "\\ecfe";
}
.icon-toc:before {
  content: "\\ecff";
}
.icon-today:before {
  content: "\\ed00";
}
.icon-toll:before {
  content: "\\ed01";
}
.icon-track_changes:before {
  content: "\\ed02";
}
.icon-translate:before {
  content: "\\ed03";
}
.icon-trending_down:before {
  content: "\\ed04";
}
.icon-trending_neutral:before {
  content: "\\ed05";
}
.icon-trending_up:before {
  content: "\\ed06";
}
.icon-verified_user:before {
  content: "\\ed07";
}
.icon-view_agenda:before {
  content: "\\ed08";
}
.icon-view_array:before {
  content: "\\ed09";
}
.icon-view_carousel:before {
  content: "\\ed0a";
}
.icon-view_column:before {
  content: "\\ed0b";
}
.icon-view_day:before {
  content: "\\ed0c";
}
.icon-view_headline:before {
  content: "\\ed0d";
}
.icon-view_list:before {
  content: "\\ed0e";
}
.icon-view_module:before {
  content: "\\ed0f";
}
.icon-view_quilt:before {
  content: "\\ed10";
}
.icon-view_stream:before {
  content: "\\ed11";
}
.icon-view_week:before {
  content: "\\ed12";
}
.icon-visibility_off:before {
  content: "\\ed13";
}
.icon-card_membership:before {
  content: "\\ed14";
}
.icon-card_travel:before {
  content: "\\ed15";
}
.icon-work:before {
  content: "\\ed16";
}
.icon-youtube_searched_for:before {
  content: "\\ed17";
}
.icon-eject:before {
  content: "\\ed18";
}
.icon-camera_enhance:before {
  content: "\\ed19";
}
.icon-help_outline:before {
  content: "\\ed1a";
}
.icon-reorder:before {
  content: "\\ed1b";
}
.icon-zoom_in:before {
  content: "\\ed1c";
}
.icon-zoom_out:before {
  content: "\\ed1d";
}
.icon-http:before {
  content: "\\ed1e";
}
.icon-event_seat:before {
  content: "\\ed1f";
}
.icon-flight_land:before {
  content: "\\ed20";
}
.icon-flight_takeoff:before {
  content: "\\ed21";
}
.icon-play_for_work:before {
  content: "\\ed22";
}
.icon-gif:before {
  content: "\\ed23";
}
.icon-indeterminate_check_box:before {
  content: "\\ed24";
}
.icon-offline_pin:before {
  content: "\\ed25";
}
.icon-all_out:before {
  content: "\\ed26";
}
.icon-copyright:before {
  content: "\\ed27";
}
.icon-fingerprint:before {
  content: "\\ed28";
}
.icon-gavel:before {
  content: "\\ed29";
}
.icon-lightbulb_outline:before {
  content: "\\ed2a";
}
.icon-picture_in_picture_alt:before {
  content: "\\ed2b";
}
.icon-important_devices:before {
  content: "\\ed2c";
}
.icon-touch_app:before {
  content: "\\ed2d";
}
.icon-accessible:before {
  content: "\\ed2e";
}
.icon-compare_arrows:before {
  content: "\\ed2f";
}
.icon-date_range:before {
  content: "\\ed30";
}
.icon-donut_large:before {
  content: "\\ed31";
}
.icon-donut_small:before {
  content: "\\ed32";
}
.icon-line_style:before {
  content: "\\ed33";
}
.icon-line_weight:before {
  content: "\\ed34";
}
.icon-motorcycle:before {
  content: "\\ed35";
}
.icon-opacity:before {
  content: "\\ed36";
}
.icon-pets:before {
  content: "\\ed37";
}
.icon-pregnant_woman:before {
  content: "\\ed38";
}
.icon-record_voice_over:before {
  content: "\\ed39";
}
.icon-rounded_corner:before {
  content: "\\ed3a";
}
.icon-rowing:before {
  content: "\\ed3b";
}
.icon-timeline:before {
  content: "\\ed3c";
}
.icon-update:before {
  content: "\\ed3d";
}
.icon-watch_later:before {
  content: "\\ed3e";
}
.icon-pan_tool:before {
  content: "\\ed3f";
}
.icon-euro_symbol:before {
  content: "\\ed40";
}
.icon-g_translate:before {
  content: "\\ed41";
}
.icon-remove_shopping_cart:before {
  content: "\\ed42";
}
.icon-restore_page:before {
  content: "\\ed43";
}
.icon-speaker_notes_off:before {
  content: "\\ed44";
}
.icon-delete_forever:before {
  content: "\\ed45";
}
.icon-accessibility_new:before {
  content: "\\ed46";
}
.icon-check_circle_outline:before {
  content: "\\ed47";
}
.icon-delete_outline:before {
  content: "\\ed48";
}
.icon-done_outline:before {
  content: "\\ed49";
}
.icon-maximize:before {
  content: "\\ed4a";
}
.icon-minimize:before {
  content: "\\ed4b";
}
.icon-offline_bolt:before {
  content: "\\ed4c";
}
.icon-swap_horizontal_circle:before {
  content: "\\ed4d";
}
.icon-accessible_forward:before {
  content: "\\ed4e";
}
.icon-calendar_today:before {
  content: "\\ed4f";
}
.icon-calendar_view_day:before {
  content: "\\ed50";
}
.icon-label_important:before {
  content: "\\ed51";
}
.icon-restore_from_trash:before {
  content: "\\ed52";
}
.icon-supervised_user_circle:before {
  content: "\\ed53";
}
.icon-text_rotate_up:before {
  content: "\\ed54";
}
.icon-text_rotate_vertical:before {
  content: "\\ed55";
}
.icon-text_rotation_angledown:before {
  content: "\\ed56";
}
.icon-text_rotation_angleup:before {
  content: "\\ed57";
}
.icon-text_rotation_down:before {
  content: "\\ed58";
}
.icon-text_rotation_none:before {
  content: "\\ed59";
}
.icon-commute:before {
  content: "\\ed5a";
}
.icon-arrow_right_alt:before {
  content: "\\ed5b";
}
.icon-work_off:before {
  content: "\\ed5c";
}
.icon-work_outline:before {
  content: "\\ed5d";
}
.icon-drag_indicator:before {
  content: "\\ed5e";
}
.icon-horizontal_split:before {
  content: "\\ed5f";
}
.icon-label_important_outline:before {
  content: "\\ed60";
}
.icon-vertical_split:before {
  content: "\\ed61";
}
.icon-voice_over_off:before {
  content: "\\ed62";
}
.icon-segment:before {
  content: "\\ed63";
}
.icon-contact_support:before {
  content: "\\ed64";
}
.icon-compress:before {
  content: "\\ed65";
}
.icon-filter_list_alt:before {
  content: "\\ed66";
}
.icon-expand:before {
  content: "\\ed67";
}
.icon-edit_off:before {
  content: "\\ed68";
}
.icon-10k:before {
  content: "\\ed69";
}
.icon-10mp:before {
  content: "\\ed6a";
}
.icon-11mp:before {
  content: "\\ed6b";
}
.icon-12mp:before {
  content: "\\ed6c";
}
.icon-13mp:before {
  content: "\\ed6d";
}
.icon-14mp:before {
  content: "\\ed6e";
}
.icon-15mp:before {
  content: "\\ed6f";
}
.icon-16mp:before {
  content: "\\ed70";
}
.icon-17mp:before {
  content: "\\ed71";
}
.icon-18mp:before {
  content: "\\ed72";
}
.icon-19mp:before {
  content: "\\ed73";
}
.icon-1k:before {
  content: "\\ed74";
}
.icon-1k_plus:before {
  content: "\\ed75";
}
.icon-20mp:before {
  content: "\\ed76";
}
.icon-21mp:before {
  content: "\\ed77";
}
.icon-22mp:before {
  content: "\\ed78";
}
.icon-23mp:before {
  content: "\\ed79";
}
.icon-24mp:before {
  content: "\\ed7a";
}
.icon-2k:before {
  content: "\\ed7b";
}
.icon-2k_plus:before {
  content: "\\ed7c";
}
.icon-2mp:before {
  content: "\\ed7d";
}
.icon-3k:before {
  content: "\\ed7e";
}
.icon-3k_plus:before {
  content: "\\ed7f";
}
.icon-3mp:before {
  content: "\\ed80";
}
.icon-4k_plus:before {
  content: "\\ed81";
}
.icon-4mp:before {
  content: "\\ed82";
}
.icon-5k:before {
  content: "\\ed83";
}
.icon-5k_plus:before {
  content: "\\ed84";
}
.icon-5mp:before {
  content: "\\ed85";
}
.icon-6k:before {
  content: "\\ed86";
}
.icon-6k_plus:before {
  content: "\\ed87";
}
.icon-6mp:before {
  content: "\\ed88";
}
.icon-7k:before {
  content: "\\ed89";
}
.icon-7k_plus:before {
  content: "\\ed8a";
}
.icon-7mp:before {
  content: "\\ed8b";
}
.icon-8k:before {
  content: "\\ed8c";
}
.icon-8k_plus:before {
  content: "\\ed8d";
}
.icon-8mp:before {
  content: "\\ed8e";
}
.icon-9k:before {
  content: "\\ed8f";
}
.icon-9k_plus:before {
  content: "\\ed90";
}
.icon-9mp:before {
  content: "\\ed91";
}
.icon-account_tree:before {
  content: "\\ed92";
}
.icon-add_chart:before {
  content: "\\ed93";
}
.icon-add_ic_call:before {
  content: "\\ed94";
}
.icon-add_moderator:before {
  content: "\\ed95";
}
.icon-all_inbox:before {
  content: "\\ed96";
}
.icon-approval:before {
  content: "\\ed97";
}
.icon-assistant_direction:before {
  content: "\\ed98";
}
.icon-assistant_navigation:before {
  content: "\\ed99";
}
.icon-bookmarks:before {
  content: "\\ed9a";
}
.icon-bus_alert:before {
  content: "\\ed9b";
}
.icon-cases:before {
  content: "\\ed9c";
}
.icon-circle_notifications:before {
  content: "\\ed9d";
}
.icon-closed_caption_off:before {
  content: "\\ed9e";
}
.icon-connected_tv:before {
  content: "\\ed9f";
}
.icon-dangerous:before {
  content: "\\eda0";
}
.icon-dashboard_customize:before {
  content: "\\eda1";
}
.icon-desktop_access_disabled:before {
  content: "\\eda2";
}
.icon-drive_file_move_outline:before {
  content: "\\eda3";
}
.icon-drive_file_rename_outline:before {
  content: "\\eda4";
}
.icon-drive_folder_upload:before {
  content: "\\eda5";
}
.icon-duo:before {
  content: "\\eda6";
}
.icon-explore_off:before {
  content: "\\eda7";
}
.icon-file_download_done:before {
  content: "\\eda8";
}
.icon-rtt:before {
  content: "\\eda9";
}
.icon-grid_view:before {
  content: "\\edaa";
}
.icon-hail:before {
  content: "\\edab";
}
.icon-home_filled:before {
  content: "\\edac";
}
.icon-imagesearch_roller:before {
  content: "\\edad";
}
.icon-label_off:before {
  content: "\\edae";
}
.icon-library_add_check:before {
  content: "\\edaf";
}
.icon-logout:before {
  content: "\\edb0";
}
.icon-margin:before {
  content: "\\edb1";
}
.icon-mark_as_unread:before {
  content: "\\edb2";
}
.icon-menu_open:before {
  content: "\\edb3";
}
.icon-mp:before {
  content: "\\edb4";
}
.icon-offline_share:before {
  content: "\\edb5";
}
.icon-padding:before {
  content: "\\edb6";
}
.icon-panorama_photosphere:before {
  content: "\\edb7";
}
.icon-panorama_photosphere_select:before {
  content: "\\edb8";
}
.icon-person_add_disabled:before {
  content: "\\edb9";
}
.icon-phone_disabled:before {
  content: "\\edba";
}
.icon-phone_enabled:before {
  content: "\\edbb";
}
.icon-pivot_table_chart:before {
  content: "\\edbc";
}
.icon-print_disabled:before {
  content: "\\edbd";
}
.icon-railway_alert:before {
  content: "\\edbe";
}
.icon-recommend:before {
  content: "\\edbf";
}
.icon-remove_done:before {
  content: "\\edc0";
}
.icon-remove_moderator:before {
  content: "\\edc1";
}
.icon-repeat_on:before {
  content: "\\edc2";
}
.icon-repeat_one_on:before {
  content: "\\edc3";
}
.icon-replay_circle_filled:before {
  content: "\\edc4";
}
.icon-reset_tv:before {
  content: "\\edc5";
}
.icon-sd:before {
  content: "\\edc6";
}
.icon-shield:before {
  content: "\\edc7";
}
.icon-shuffle_on:before {
  content: "\\edc8";
}
.icon-speed:before {
  content: "\\edc9";
}
.icon-stacked_bar_chart:before {
  content: "\\edca";
}
.icon-stream:before {
  content: "\\edcb";
}
.icon-swipe:before {
  content: "\\edcc";
}
.icon-switch_account:before {
  content: "\\edcd";
}
.icon-tag:before {
  content: "\\edce";
}
.icon-thumb_down_off_alt:before {
  content: "\\edcf";
}
.icon-thumb_up_off_alt:before {
  content: "\\edd0";
}
.icon-toggle_off:before {
  content: "\\edd1";
}
.icon-toggle_on:before {
  content: "\\edd2";
}
.icon-two_wheeler:before {
  content: "\\edd3";
}
.icon-upload_file:before {
  content: "\\edd4";
}
.icon-view_in_ar:before {
  content: "\\edd5";
}
.icon-waterfall_chart:before {
  content: "\\edd6";
}
.icon-wb_shade:before {
  content: "\\edd7";
}
.icon-wb_twighlight:before {
  content: "\\edd8";
}
.icon-home_work:before {
  content: "\\edd9";
}
.icon-schedule_send:before {
  content: "\\edda";
}
.icon-bolt:before {
  content: "\\eddb";
}
.icon-send_and_archive:before {
  content: "\\eddc";
}
.icon-workspaces_filled:before {
  content: "\\eddd";
}
.icon-file_present:before {
  content: "\\edde";
}
.icon-workspaces_outline:before {
  content: "\\eddf";
}
.icon-fit_screen:before {
  content: "\\ede0";
}
.icon-saved_search:before {
  content: "\\ede1";
}
.icon-storefront:before {
  content: "\\ede2";
}
.icon-amp_stories:before {
  content: "\\ede3";
}
.icon-dynamic_feed:before {
  content: "\\ede4";
}
.icon-euro:before {
  content: "\\ede5";
}
.icon-height:before {
  content: "\\ede6";
}
.icon-policy:before {
  content: "\\ede7";
}
.icon-sync_alt:before {
  content: "\\ede8";
}
.icon-menu_book:before {
  content: "\\ede9";
}
.icon-emoji_flags:before {
  content: "\\edea";
}
.icon-emoji_food_beverage:before {
  content: "\\edeb";
}
.icon-emoji_nature:before {
  content: "\\edec";
}
.icon-emoji_people:before {
  content: "\\eded";
}
.icon-emoji_symbols:before {
  content: "\\edee";
}
.icon-emoji_transportation:before {
  content: "\\edef";
}
.icon-post_add:before {
  content: "\\edf0";
}
.icon-people_alt:before {
  content: "\\edf1";
}
.icon-emoji_emotions:before {
  content: "\\edf2";
}
.icon-emoji_events:before {
  content: "\\edf3";
}
.icon-emoji_objects:before {
  content: "\\edf4";
}
.icon-sports_basketball:before {
  content: "\\edf5";
}
.icon-sports_cricket:before {
  content: "\\edf6";
}
.icon-sports_esports:before {
  content: "\\edf7";
}
.icon-sports_football:before {
  content: "\\edf8";
}
.icon-sports_golf:before {
  content: "\\edf9";
}
.icon-sports_hockey:before {
  content: "\\edfa";
}
.icon-sports_mma:before {
  content: "\\edfb";
}
.icon-sports_motorsports:before {
  content: "\\edfc";
}
.icon-sports_rugby:before {
  content: "\\edfd";
}
.icon-sports_soccer:before {
  content: "\\edfe";
}
.icon-sports:before {
  content: "\\edff";
}
.icon-sports_volleyball:before {
  content: "\\ee00";
}
.icon-sports_tennis:before {
  content: "\\ee01";
}
.icon-sports_handball:before {
  content: "\\ee02";
}
.icon-sports_kabaddi:before {
  content: "\\ee03";
}
.icon-eco:before {
  content: "\\ee04";
}
.icon-museum:before {
  content: "\\ee05";
}
.icon-flip_camera_android:before {
  content: "\\ee06";
}
.icon-flip_camera_ios:before {
  content: "\\ee07";
}
.icon-cancel_schedule_send:before {
  content: "\\ee08";
}
.icon-apartment:before {
  content: "\\ee09";
}
.icon-bathtub:before {
  content: "\\ee0a";
}
.icon-deck:before {
  content: "\\ee0b";
}
.icon-fireplace:before {
  content: "\\ee0c";
}
.icon-house:before {
  content: "\\ee0d";
}
.icon-king_bed:before {
  content: "\\ee0e";
}
.icon-nights_stay:before {
  content: "\\ee0f";
}
.icon-outdoor_grill:before {
  content: "\\ee10";
}
.icon-single_bed:before {
  content: "\\ee11";
}
.icon-square_foot:before {
  content: "\\ee12";
}
.icon-double_arrow:before {
  content: "\\ee13";
}
.icon-sports_baseball:before {
  content: "\\ee14";
}
.icon-attractions:before {
  content: "\\ee15";
}
.icon-bakery_dining:before {
  content: "\\ee16";
}
.icon-breakfast_dining:before {
  content: "\\ee17";
}
.icon-car_rental:before {
  content: "\\ee18";
}
.icon-car_repair:before {
  content: "\\ee19";
}
.icon-dinner_dining:before {
  content: "\\ee1a";
}
.icon-dry_cleaning:before {
  content: "\\ee1b";
}
.icon-hardware:before {
  content: "\\ee1c";
}
.icon-liquor:before {
  content: "\\ee1d";
}
.icon-lunch_dining:before {
  content: "\\ee1e";
}
.icon-nightlife:before {
  content: "\\ee1f";
}
.icon-park:before {
  content: "\\ee20";
}
.icon-ramen_dining:before {
  content: "\\ee21";
}
.icon-celebration:before {
  content: "\\ee22";
}
.icon-theater_comedy:before {
  content: "\\ee23";
}
.icon-badge:before {
  content: "\\ee24";
}
.icon-festival:before {
  content: "\\ee25";
}
.icon-icecream:before {
  content: "\\ee26";
}
.icon-volunteer_activism:before {
  content: "\\ee27";
}
.icon-contactless:before {
  content: "\\ee28";
}
.icon-delivery_dining:before {
  content: "\\ee29";
}
.icon-brunch_dining:before {
  content: "\\ee2a";
}
.icon-takeout_dining:before {
  content: "\\ee2b";
}
.icon-ac_unit:before {
  content: "\\ee2c";
}
.icon-airport_shuttle:before {
  content: "\\ee2d";
}
.icon-all_inclusive:before {
  content: "\\ee2e";
}
.icon-beach_access:before {
  content: "\\ee2f";
}
.icon-business_center:before {
  content: "\\ee30";
}
.icon-casino:before {
  content: "\\ee31";
}
.icon-child_care:before {
  content: "\\ee32";
}
.icon-child_friendly:before {
  content: "\\ee33";
}
.icon-fitness_center:before {
  content: "\\ee34";
}
.icon-golf_course:before {
  content: "\\ee35";
}
.icon-hot_tub:before {
  content: "\\ee36";
}
.icon-kitchen:before {
  content: "\\ee37";
}
.icon-pool:before {
  content: "\\ee38";
}
.icon-room_service:before {
  content: "\\ee39";
}
.icon-smoke_free:before {
  content: "\\ee3a";
}
.icon-smoking_rooms:before {
  content: "\\ee3b";
}
.icon-spa:before {
  content: "\\ee3c";
}
.icon-no_meeting_room:before {
  content: "\\ee3d";
}
.icon-meeting_room:before {
  content: "\\ee3e";
}
.icon-goat:before {
  content: "\\ee3f";
}
.icon-5g:before {
  content: "\\ee40";
}
.icon-ad_units:before {
  content: "\\ee41";
}
.icon-add_business:before {
  content: "\\ee42";
}
.icon-add_location_alt:before {
  content: "\\ee43";
}
.icon-add_road:before {
  content: "\\ee44";
}
.icon-add_to_drive:before {
  content: "\\ee45";
}
.icon-addchart:before {
  content: "\\ee46";
}
.icon-admin_panel_settings:before {
  content: "\\ee47";
}
.icon-agriculture:before {
  content: "\\ee48";
}
.icon-alt_route:before {
  content: "\\ee49";
}
.icon-analytics:before {
  content: "\\ee4a";
}
.icon-anchor:before {
  content: "\\ee4b";
}
.icon-animation:before {
  content: "\\ee4c";
}
.icon-api:before {
  content: "\\ee4d";
}
.icon-app_blocking:before {
  content: "\\ee4e";
}
.icon-app_registration:before {
  content: "\\ee4f";
}
.icon-app_settings_alt:before {
  content: "\\ee50";
}
.icon-architecture:before {
  content: "\\ee51";
}
.icon-arrow_circle_down:before {
  content: "\\ee52";
}
.icon-arrow_circle_up:before {
  content: "\\ee53";
}
.icon-article:before {
  content: "\\ee54";
}
.icon-attach_email:before {
  content: "\\ee55";
}
.icon-auto_awesome:before {
  content: "\\ee56";
}
.icon-auto_awesome_mosaic:before {
  content: "\\ee57";
}
.icon-auto_awesome_motion:before {
  content: "\\ee58";
}
.icon-auto_delete:before {
  content: "\\ee59";
}
.icon-auto_fix_high:before {
  content: "\\ee5a";
}
.icon-auto_fix_normal:before {
  content: "\\ee5b";
}
.icon-auto_fix_off:before {
  content: "\\ee5c";
}
.icon-auto_stories:before {
  content: "\\ee5d";
}
.icon-baby_changing_station:before {
  content: "\\ee5e";
}
.icon-backpack:before {
  content: "\\ee5f";
}
.icon-backup_table:before {
  content: "\\ee60";
}
.icon-batch_prediction:before {
  content: "\\ee61";
}
.icon-bedtime:before {
  content: "\\ee62";
}
.icon-bento:before {
  content: "\\ee63";
}
.icon-bike_scooter:before {
  content: "\\ee64";
}
.icon-biotech:before {
  content: "\\ee65";
}
.icon-block_flipped:before {
  content: "\\ee66";
}
.icon-browser_not_supported:before {
  content: "\\ee67";
}
.icon-build_circle:before {
  content: "\\ee68";
}
.icon-calculate:before {
  content: "\\ee69";
}
.icon-campaign:before {
  content: "\\ee6a";
}
.icon-carpenter:before {
  content: "\\ee6b";
}
.icon-cast_for_education:before {
  content: "\\ee6c";
}
.icon-charging_station:before {
  content: "\\ee6d";
}
.icon-checkroom:before {
  content: "\\ee6e";
}
.icon-circle:before {
  content: "\\ee6f";
}
.icon-cleaning_services:before {
  content: "\\ee70";
}
.icon-close_fullscreen:before {
  content: "\\ee71";
}
.icon-closed_caption_disabled:before {
  content: "\\ee72";
}
.icon-comment_bank:before {
  content: "\\ee73";
}
.icon-construction:before {
  content: "\\ee74";
}
.icon-corporate_fare:before {
  content: "\\ee75";
}
.icon-countertops:before {
  content: "\\ee76";
}
.icon-design_services:before {
  content: "\\ee77";
}
.icon-directions_off:before {
  content: "\\ee78";
}
.icon-dirty_lens:before {
  content: "\\ee79";
}
.icon-do_not_step:before {
  content: "\\ee7a";
}
.icon-do_not_touch:before {
  content: "\\ee7b";
}
.icon-domain_verification:before {
  content: "\\ee7c";
}
.icon-drive_file_move:before {
  content: "\\ee7d";
}
.icon-dry:before {
  content: "\\ee7e";
}
.icon-dynamic_form:before {
  content: "\\ee7f";
}
.icon-east:before {
  content: "\\ee80";
}
.icon-edit_road:before {
  content: "\\ee81";
}
.icon-electric_bike:before {
  content: "\\ee82";
}
.icon-electric_car:before {
  content: "\\ee83";
}
.icon-electric_moped:before {
  content: "\\ee84";
}
.icon-electric_rickshaw:before {
  content: "\\ee85";
}
.icon-electric_scooter:before {
  content: "\\ee86";
}
.icon-electrical_services:before {
  content: "\\ee87";
}
.icon-elevator:before {
  content: "\\ee88";
}
.icon-engineering:before {
  content: "\\ee89";
}
.icon-escalator:before {
  content: "\\ee8a";
}
.icon-escalator_warning:before {
  content: "\\ee8b";
}
.icon-face_retouching_natural:before {
  content: "\\ee8c";
}
.icon-fact_check:before {
  content: "\\ee8d";
}
.icon-family_restroom:before {
  content: "\\ee8e";
}
.icon-fence:before {
  content: "\\ee8f";
}
.icon-filter_alt:before {
  content: "\\ee90";
}
.icon-fire_extinguisher:before {
  content: "\\ee91";
}
.icon-flaky:before {
  content: "\\ee92";
}
.icon-food_bank:before {
  content: "\\ee93";
}
.icon-forward_to_inbox:before {
  content: "\\ee94";
}
.icon-foundation:before {
  content: "\\ee95";
}
.icon-grading:before {
  content: "\\ee96";
}
.icon-grass:before {
  content: "\\ee97";
}
.icon-handyman:before {
  content: "\\ee98";
}
.icon-hdr_enhanced_select:before {
  content: "\\ee99";
}
.icon-hearing_disabled:before {
  content: "\\ee9a";
}
.icon-help_center:before {
  content: "\\ee9b";
}
.icon-highlight_alt:before {
  content: "\\ee9c";
}
.icon-history_edu:before {
  content: "\\ee9d";
}
.icon-history_toggle_off:before {
  content: "\\ee9e";
}
.icon-home_repair_service:before {
  content: "\\ee9f";
}
.icon-horizontal_rule:before {
  content: "\\eea0";
}
.icon-hourglass_bottom:before {
  content: "\\eea1";
}
.icon-hourglass_disabled:before {
  content: "\\eea2";
}
.icon-hourglass_top:before {
  content: "\\eea3";
}
.icon-house_siding:before {
  content: "\\eea4";
}
.icon-hvac:before {
  content: "\\eea5";
}
.icon-image_not_supported:before {
  content: "\\eea6";
}
.icon-insights:before {
  content: "\\eea7";
}
.icon-integration_instructions:before {
  content: "\\eea8";
}
.icon-ios_share:before {
  content: "\\eea9";
}
.icon-legend_toggle:before {
  content: "\\eeaa";
}
.icon-local_fire_department:before {
  content: "\\eeab";
}
.icon-local_police:before {
  content: "\\eeac";
}
.icon-location_pin:before {
  content: "\\eead";
}
.icon-lock_clock:before {
  content: "\\eeae";
}
.icon-login:before {
  content: "\\eeaf";
}
.icon-maps_ugc:before {
  content: "\\eeb0";
}
.icon-mark_chat_read:before {
  content: "\\eeb1";
}
.icon-mark_chat_unread:before {
  content: "\\eeb2";
}
.icon-mark_email_read:before {
  content: "\\eeb3";
}
.icon-mark_email_unread:before {
  content: "\\eeb4";
}
.icon-mediation:before {
  content: "\\eeb5";
}
.icon-medical_services:before {
  content: "\\eeb6";
}
.icon-mic_external_off:before {
  content: "\\eeb7";
}
.icon-mic_external_on:before {
  content: "\\eeb8";
}
.icon-microwave:before {
  content: "\\eeb9";
}
.icon-military_tech:before {
  content: "\\eeba";
}
.icon-miscellaneous_services:before {
  content: "\\eebb";
}
.icon-model_training:before {
  content: "\\eebc";
}
.icon-monitor:before {
  content: "\\eebd";
}
.icon-moped:before {
  content: "\\eebe";
}
.icon-more_time:before {
  content: "\\eebf";
}
.icon-motion_photos_off:before {
  content: "\\eec0";
}
.icon-motion_photos_on:before {
  content: "\\eec1";
}
.icon-motion_photos_paused:before {
  content: "\\eec2";
}
.icon-multiple_stop:before {
  content: "\\eec3";
}
.icon-nat:before {
  content: "\\eec4";
}
.icon-near_me_disabled:before {
  content: "\\eec5";
}
.icon-next_plan:before {
  content: "\\eec6";
}
.icon-night_shelter:before {
  content: "\\eec7";
}
.icon-nightlight_round:before {
  content: "\\eec8";
}
.icon-no_cell:before {
  content: "\\eec9";
}
.icon-no_drinks:before {
  content: "\\eeca";
}
.icon-no_flash:before {
  content: "\\eecb";
}
.icon-no_food:before {
  content: "\\eecc";
}
.icon-no_meals:before {
  content: "\\eecd";
}
.icon-no_photography:before {
  content: "\\eece";
}
.icon-no_stroller:before {
  content: "\\eecf";
}
.icon-no_transfer:before {
  content: "\\eed0";
}
.icon-north:before {
  content: "\\eed1";
}
.icon-north_east:before {
  content: "\\eed2";
}
.icon-north_west:before {
  content: "\\eed3";
}
.icon-not_accessible:before {
  content: "\\eed4";
}
.icon-not_started:before {
  content: "\\eed5";
}
.icon-online_prediction:before {
  content: "\\eed6";
}
.icon-open_in_full:before {
  content: "\\eed7";
}
.icon-outbox:before {
  content: "\\eed8";
}
.icon-outgoing_mail:before {
  content: "\\eed9";
}
.icon-outlet:before {
  content: "\\eeda";
}
.icon-panorama_horizontal_select:before {
  content: "\\eedb";
}
.icon-panorama_vertical_select:before {
  content: "\\eedc";
}
.icon-panorama_wide_angle_select:before {
  content: "\\eedd";
}
.icon-payments:before {
  content: "\\eede";
}
.icon-pedal_bike:before {
  content: "\\eedf";
}
.icon-pending:before {
  content: "\\eee0";
}
.icon-pending_actions:before {
  content: "\\eee1";
}
.icon-person_add_alt:before {
  content: "\\eee2";
}
.icon-person_add_alt_1:before {
  content: "\\eee3";
}
.icon-person_remove:before {
  content: "\\eee4";
}
.icon-person_search:before {
  content: "\\eee5";
}
.icon-pest_control:before {
  content: "\\eee6";
}
.icon-pest_control_rodent:before {
  content: "\\eee7";
}
.icon-photo_camera_back:before {
  content: "\\eee8";
}
.icon-photo_camera_front:before {
  content: "\\eee9";
}
.icon-plagiarism:before {
  content: "\\eeea";
}
.icon-play_disabled:before {
  content: "\\eeeb";
}
.icon-plumbing:before {
  content: "\\eeec";
}
.icon-point_of_sale:before {
  content: "\\eeed";
}
.icon-preview:before {
  content: "\\eeee";
}
.icon-privacy_tip:before {
  content: "\\eeef";
}
.icon-psychology:before {
  content: "\\eef0";
}
.icon-public_off:before {
  content: "\\eef1";
}
.icon-push_pin:before {
  content: "\\eef2";
}
.icon-qr_code:before {
  content: "\\eef3";
}
.icon-qr_code_scanner:before {
  content: "\\eef4";
}
.icon-quickreply:before {
  content: "\\eef5";
}
.icon-read_more:before {
  content: "\\eef6";
}
.icon-receipt_long:before {
  content: "\\eef7";
}
.icon-request_quote:before {
  content: "\\eef8";
}
.icon-rice_bowl:before {
  content: "\\eef9";
}
.icon-roofing:before {
  content: "\\eefa";
}
.icon-room_preferences:before {
  content: "\\eefb";
}
.icon-rule:before {
  content: "\\eefc";
}
.icon-rule_folder:before {
  content: "\\eefd";
}
.icon-run_circle:before {
  content: "\\eefe";
}
.icon-science:before {
  content: "\\eeff";
}
.icon-screen_search_desktop:before {
  content: "\\ef00";
}
.icon-search_off:before {
  content: "\\ef01";
}
.icon-self_improvement:before {
  content: "\\ef02";
}
.icon-sensor_door:before {
  content: "\\ef03";
}
.icon-sensor_window:before {
  content: "\\ef04";
}
.icon-set_meal:before {
  content: "\\ef05";
}
.icon-shopping_bag:before {
  content: "\\ef06";
}
.icon-signal_cellular_0_bar:before {
  content: "\\ef07";
}
.icon-signal_wifi_0_bar:before {
  content: "\\ef08";
}
.icon-smart_button:before {
  content: "\\ef09";
}
.icon-snippet_folder:before {
  content: "\\ef0a";
}
.icon-soap:before {
  content: "\\ef0b";
}
.icon-source:before {
  content: "\\ef0c";
}
.icon-south:before {
  content: "\\ef0d";
}
.icon-south_east:before {
  content: "\\ef0e";
}
.icon-south_west:before {
  content: "\\ef0f";
}
.icon-sports_bar:before {
  content: "\\ef10";
}
.icon-stairs:before {
  content: "\\ef11";
}
.icon-star_outline1:before {
  content: "\\ef12";
}
.icon-star_rate:before {
  content: "\\ef13";
}
.icon-sticky_note_2:before {
  content: "\\ef14";
}
.icon-stop_circle:before {
  content: "\\ef15";
}
.icon-stroller:before {
  content: "\\ef16";
}
.icon-subscript:before {
  content: "\\ef17";
}
.icon-subtitles_off:before {
  content: "\\ef18";
}
.icon-superscript:before {
  content: "\\ef19";
}
.icon-support:before {
  content: "\\ef1a";
}
.icon-support_agent:before {
  content: "\\ef1b";
}
.icon-switch_left:before {
  content: "\\ef1c";
}
.icon-switch_right:before {
  content: "\\ef1d";
}
.icon-table_rows:before {
  content: "\\ef1e";
}
.icon-table_view:before {
  content: "\\ef1f";
}
.icon-tapas:before {
  content: "\\ef20";
}
.icon-taxi_alert:before {
  content: "\\ef21";
}
.icon-text_snippet:before {
  content: "\\ef22";
}
.icon-tour:before {
  content: "\\ef23";
}
.icon-tty:before {
  content: "\\ef24";
}
.icon-umbrella:before {
  content: "\\ef25";
}
.icon-upgrade:before {
  content: "\\ef26";
}
.icon-verified:before {
  content: "\\ef27";
}
.icon-video_settings:before {
  content: "\\ef28";
}
.icon-view_sidebar:before {
  content: "\\ef29";
}
.icon-wash:before {
  content: "\\ef2a";
}
.icon-water_damage:before {
  content: "\\ef2b";
}
.icon-west:before {
  content: "\\ef2c";
}
.icon-wheelchair_pickup:before {
  content: "\\ef2d";
}
.icon-wifi_calling:before {
  content: "\\ef2e";
}
.icon-wifi_protected_setup:before {
  content: "\\ef2f";
}
.icon-wine_bar:before {
  content: "\\ef30";
}
.icon-wrong_location:before {
  content: "\\ef31";
}
.icon-wysiwyg:before {
  content: "\\ef32";
}
.icon-leaderboard:before {
  content: "\\ef33";
}
.icon-6_ft_apart:before {
  content: "\\ef34";
}
.icon-book_online:before {
  content: "\\ef35";
}
.icon-clean_hands:before {
  content: "\\ef36";
}
.icon-connect_without_contact:before {
  content: "\\ef37";
}
.icon-coronavirus:before {
  content: "\\ef38";
}
.icon-elderly:before {
  content: "\\ef39";
}
.icon-follow_the_signs:before {
  content: "\\ef3a";
}
.icon-leave_bags_at_home:before {
  content: "\\ef3b";
}
.icon-masks:before {
  content: "\\ef3c";
}
.icon-reduce_capacity:before {
  content: "\\ef3d";
}
.icon-sanitizer:before {
  content: "\\ef3e";
}
.icon-send_to_mobile:before {
  content: "\\ef3f";
}
.icon-sick:before {
  content: "\\ef40";
}
.icon-add_task:before {
  content: "\\ef41";
}
.icon-contact_page:before {
  content: "\\ef42";
}
.icon-disabled_by_default:before {
  content: "\\ef43";
}
.icon-facebook:before {
  content: "\\ef44";
}
.icon-groups:before {
  content: "\\ef45";
}
.icon-luggage:before {
  content: "\\ef46";
}
.icon-no_backpack:before {
  content: "\\ef47";
}
.icon-no_luggage:before {
  content: "\\ef48";
}
.icon-outbond:before {
  content: "\\ef49";
}
.icon-published_with_changes:before {
  content: "\\ef4a";
}
.icon-request_page:before {
  content: "\\ef4b";
}
.icon-stacked_line_chart:before {
  content: "\\ef4c";
}
.icon-unpublished:before {
  content: "\\ef4d";
}
.icon-align_horizontal_center:before {
  content: "\\ef4e";
}
.icon-align_horizontal_left:before {
  content: "\\ef4f";
}
.icon-align_horizontal_right:before {
  content: "\\ef50";
}
.icon-align_vertical_bottom:before {
  content: "\\ef51";
}
.icon-align_vertical_center:before {
  content: "\\ef52";
}
.icon-align_vertical_top:before {
  content: "\\ef53";
}
.icon-horizontal_distribute:before {
  content: "\\ef54";
}
.icon-qr_code_2:before {
  content: "\\ef55";
}
.icon-update_disabled:before {
  content: "\\ef56";
}
.icon-vertical_distribute:before {
  content: "\\ef57";
}
.icon-chevron-down-light:before {
  content: "\\ef58";
}
.icon-edit:before {
  content: "\\ef59";
}
`