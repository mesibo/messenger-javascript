// uiconfig.js

/*
 * Settings of the messenger UI: message options, disappearing messages and sensitive messages.
 * The names, defaults and texts are those of MesiboUiConfig on Android and iOS, so that the
 * apps behave the same.
 */

/* When the disappearing time of a message starts: MesiboUI.TIMERSTART_* on Android */
const TIMERSTART_SENT = 0;
const TIMERSTART_DELIVERED = 1;
const TIMERSTART_READ = 2;

/* The filters above the chat list: MesiboUI.CHATFILTER_* on Android */
const CHATFILTER_ALL = 0;
const CHATFILTER_UNREAD = 1;
const CHATFILTER_FAVORITES = 2;
const CHATFILTER_GROUPS = 3;
const CHATFILTER_ONLINE = 4;

var MessengerUiConfig = {

	/* The chat list: archived chats, filters, favorites and mute */
	userList: {
		/*
		 * Archived chats are left out of the chat list; an "Archived" row at the top opens them.
		 * Chats are archived and unarchived from the menu of a chat.
		 */
		enableArchive: true,

		/* a new message in an archived chat brings it back to the chat list */
		unarchiveOnNewMessage: false,
		archivedTitle: "Archived",
		archiveTitle: "Archive",
		unarchiveTitle: "Unarchive",
		emptyArchivedMessage: "No archived chats",

		/* the filters above the chat list (not in the archived chats), in order; the first is selected */
		enableFilters: true,
		filters: [
			{value: CHATFILTER_ALL, title: "All"},
			{value: CHATFILTER_UNREAD, title: "Unread"},
			{value: CHATFILTER_FAVORITES, title: "Favorites"},
			{value: CHATFILTER_GROUPS, title: "Groups"},
			{value: CHATFILTER_ONLINE, title: "Online"}],
		emptyFilterMessage: "No chats here",

		favoriteTitle: "Favorite",
		unfavoriteTitle: "Remove from favorites",
		muteTitle: "Mute",
		unmuteTitle: "Unmute"
	},

	/* The settings rows of the profile screen */
	profileViewer: {
		muteTitle: "Mute notifications",
		favoriteTitle: "Favorite"
	},

	/* The message options button in the message input, and its sheet */
	messageOptions: {
		enabled: true,
		title: "Message options",

		/* disappear after: seconds; 0 leaves the chat's own setting */
		ages: [
			{value: 0, title: "Never"},
			{value: 3600, title: "1 hour"},
			{value: 86400, title: "24 hours"},
			{value: 604800, title: "7 days"},
			{value: 7776000, title: "90 days"}],
		ageTitle: "Disappear after",

		/* when the disappear after time starts; empty: always when sent */
		timerStarts: [
			{value: TIMERSTART_SENT, title: "When sent"},
			{value: TIMERSTART_DELIVERED, title: "When delivered"},
			{value: TIMERSTART_READ, title: "When read"}],
		timerStartTitle: "Timer starts",

		/* not delivered within this: not delivered at all; seconds, 0 the messaging default */
		expiries: [
			{value: 0, title: "Default"},
			{value: 15, title: "Now"},
			{value: 3600, title: "1 hour"},
			{value: 86400, title: "24 hours"},
			{value: 604800, title: "7 days"}],
		expiryTitle: "Expires if not delivered in",

		/* the sensitivity levels; detail is shown under the row for the selected one */
		sensitivities: [
			{value: 0, title: "Off", detail: "Shown normally"},
			{value: 1, title: "Private", detail: "Hidden in the chat list, replies and quotes"},
			{value: 2, title: "Sensitive", detail: "Also covered until tapped, can't be forwarded"},
			{value: 3, title: "Confidential", detail: "Also covered again when reopened, can't be copied"}],
		sensitivityTitle: "Sensitivity",

		keepTitle: "For all messages in this chat",
		clearTitle: "Clear",
		doneTitle: "Done",

		/* in place of Done when a message is typed: sends it with the options */
		sendTitle: "Send"
	},

	/* The disappearing messages screen of a chat */
	disappearing: {
		/* seconds; a title is made from the time when not set. Off is always first */
		durations: [
			{value: 3600},
			{value: 86400},
			{value: 604800},
			{value: 7776000}],
		enableTimerStart: true,
		timerStarts: [
			{value: TIMERSTART_SENT, title: "When sent"},
			{value: TIMERSTART_DELIVERED, title: "When delivered"},
			{value: TIMERSTART_READ, title: "When read"}],
		title: "Disappearing messages",
		helpMessage: "Messages you send in this chat disappear after the selected time. Messages already sent don't change.",
		offTitle: "Off",
		durationTitle: "Disappear after",
		timerStartTitle: "Timer starts"
	},

	/*
	 * The time of a message and the icons by it. The colors are the defaults of Android and iOS:
	 * theme.metaColor for the time and the grey ticks, readColor, theme.errorColor.
	 */
	messageStatus: {
		timeColor: "#667781",
		pendingColor: "#667781",
		sentColor: "#667781",
		deliveredColor: "#667781",
		readColor: "#53bdeb",
		failedColor: "#ea0038",

		/* the timer by the time of a disappearing message */
		showTimerIcon: true,

		/* shown on a tap on a disappearing message; %s is the time left */
		disappearsInTitle: "Disappears in %s"
	},

	/* Keep a disappearing message */
	messages: {
		enableKeep: true,
		keepTitle: "Keep"
	},

	/*
	 * Sensitive messages. Each ...Level is a threshold: it applies to messages whose sensitivity
	 * is at least that level; 0 turns it off.
	 */
	sensitivity: {
		showIconLevel: 1,
		hidePreviewLevel: 1,
		blockKeepLevel: 1,
		tapToViewLevel: 2,
		coverSent: false,
		blockForwardLevel: 2,
		coverAgainLevel: 3,
		blockCopyLevel: 3,
		title: "Sensitive message",
		tapToViewTitle: "Tap to view",
		blockedKeepMessage: "This message can't be kept",
		blockedForwardMessage: "This message can't be forwarded",
		blockedCopyMessage: "This message can't be copied"
	}
};

/*
 * The title of a time in seconds, as on Android: the app's own title from durations if set, else
 * days from two days up, then hours, minutes and seconds.
 */
function messengerDurationTitle(seconds) {
	var o = MessengerUiConfig.disappearing;
	if(!seconds || seconds <= 0)
		return o.offTitle;

	for(var i = 0; i < o.durations.length; i++) {
		var d = o.durations[i];
		if(d.value == seconds && d.title)
			return d.title;
	}

	var day = 86400, hour = 3600, minute = 60;

	if(seconds >= 2*day && 0 == seconds % day)
		return (seconds/day) + " days";

	if(0 == seconds % hour)
		return (seconds == hour) ? "1 hour" : (seconds/hour) + " hours";

	if(0 == seconds % minute)
		return (seconds == minute) ? "1 minute" : (seconds/minute) + " minutes";

	return seconds + " seconds";
}

/* A short time left, for example 3d, 5h, 12m or 40s */
function messengerShortDuration(seconds) {
	if(seconds >= 86400) return Math.floor(seconds/86400) + "d";
	if(seconds >= 3600) return Math.floor(seconds/3600) + "h";
	if(seconds >= 60) return Math.floor(seconds/60) + "m";
	return seconds + "s";
}

/* The sensitivity of a message reaches a threshold of the sensitivity settings (0 is off) */
function messengerSensitiveAt(m, threshold) {
	if(!m || !threshold || threshold <= 0)
		return false;

	var s = m.getSensitivity ? m.getSensitivity() : 0;
	return (s >= threshold);
}
