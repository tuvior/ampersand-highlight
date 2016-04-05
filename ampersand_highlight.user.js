// ==UserScript==
// @name         % Highlight
// @namespace    http://tampermonkey.net/
// @version      2.9
// @description  No spam please!
// @author       /u/tuvior
// @include      https://www.reddit.com/robin*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @downloadURL  https://raw.githubusercontent.com/tuvior/ampersand_highlight/master/ampersand_highlight.user.js
// @updateURL    https://raw.githubusercontent.com/tuvior/ampersand_highlight/master/ampersand_highlight.user.js
// @grant        GM_getValue
// ==/UserScript==
(function () {

    //add names of the bad guys here
    var badMonkeys = [
        'chapebrone',
        'nigglet'
    ];

    //change this for your cool groups
    var prefix = '%chat';

    //trivia hosts
    var triviaHosts = [
        'dthunder',
        'nbagf',
        'npinsker'
    ];

    var prefixes = {
        "%"         : "rgba(204,204,0,.3)",
        "%chat"     : "rgba(255,165,0,.3)",
        "#"         : "rgba(165,255,0,.3)",
        "#gov"      : "rgba(0,165,255,.3)",
        "&"         : "rgba(0,255,165,.3)",
        "^"         : "rgba(165,0,255,.3)",
        "#rpg"      : "rgba(153,102,255,.3)",
        "%parrot"   : "rgba(0,153,153,.3"
    };

    var seen_channels = [];

    var filter = [
        '%chat',
        '^',
        '#'
    ];

    //our name
    var username = $('div#header span.user a').html();

    var plain = false;

    //trivia prefix
    var t_prefix = '$';
    var plain_prefix = '-';

    String.prototype.lpad = function (padString, length) {
        var str = this;
        var prepend_str = "";
        for (var i = str.length; i < length; i++) {
            prepend_str = padString + prepend_str;
        }
        return prepend_str + str;
    };

    String.prototype.rpad = function (padString, length) {
        var str = this;
        var prepend_str = "";
        for (var i = str.length; i < length; i++) {
            prepend_str = padString + prepend_str;
        }
        return str + prepend_str;
    };

    // mutation observer for new messages, thanks to Leo :)
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            var added = mutation.addedNodes[0];

            // Processes all new messages
            if ($(added).hasClass("robin-message")) {
                checkForPrefixes(added);
            }
        });
    });
    observer.observe($("#robinChatMessageList").get(0), {
        childList: true
    });

    function checkForPrefixes(message) {
        var msgItem = $(message);
        var msg = msgItem["0"].getElementsByClassName("robin-message--message")[0].innerHTML.trim();
        var name = msgItem["0"].getElementsByClassName("robin-message--from robin--username")[0].innerHTML;

        var msg_prefix = isPrefix(msg.split(" ")[0]) ? msg.split(" ")[0] : '';

        msgItem.css({"font-family": 'Consolas'});

        if (name === '[robin]' || name.contains('ampersand_highlight')) return;

        if (msg_prefix !== '' && isPrefix(msg_prefix) && seen_channels.indexOf(msg_prefix) < 0) {
            seen_channels.push(msg_prefix);
        }

        if ($.inArray(name, badMonkeys) > -1 || ($.inArray(msg_prefix, filter) < 0 && !isMention(msg, name))) {
            msgItem.remove();
            return;
        }

        if (prefixes[msg_prefix] !== undefined || plain) {
            msgItem["0"].getElementsByClassName("robin-message--message")[0].innerHTML = msg.substring(msg_prefix.length).trim();
            msgItem["0"].getElementsByClassName("robin-message--from robin--username")[0].innerHTML = ('[' + msg_prefix + ']').rpad("&nbsp", 10) + ' ' + name.lpad('&nbsp;', 19);
            msgItem.css({
                background: prefixes[msg_prefix] == undefined ? '' : prefixes[msg_prefix],
                color: 'black',
                "font-weight": 'bold'
            });

            if (isMention(msg, name)) {
                msgItem.css({
                    color: 'red'
                });
            }
        } else if (msg.startsWith(t_prefix)) {
            msgItem["0"].getElementsByClassName("robin-message--message")[0].innerHTML = msg.substring(t_prefix.length).trim();
            msgItem["0"].getElementsByClassName("robin-message--from robin--username")[0].innerHTML = '[' + t_prefix + '] ' + name;
            if ($.inArray(name, triviaHosts) >= 0) {
                msgItem.css({
                    background: "rgba(107, 207, 95, 0.8)",
                    color: 'white',
                    "font-weight": 'bold'
                });
            } else {
                msgItem.css({
                    background: "LightGray",
                    color: 'black',
                    "font-family": 'Consolas'
                });

                if (name === username) {
                    msgItem.css({
                        "font-weight": 'bold'
                    });
                }
            }
        }
    }

    function isPrefix(string) {
        return !string[0].match(/^[a-zA-Z0-9]*$/) && string[0] !== '[';
    }

    function isMention(message, user) {
        return message.toLowerCase().contains(username.toLowerCase()) && user !== username
    }

    function systemMessage(message) {
        var sys = $(".robin--message-class--message.robin--user-class--user").last().clone();
        sys.css({
            background: "",
            color: '',
            "font-weight": ''
        });
        sys["0"].getElementsByClassName("robin-message--message")[0].innerHTML = message;
        ;
        sys["0"].getElementsByClassName("robin-message--from robin--username")[0].innerHTML = ('[]').rpad("&nbsp", 10) + ' ' + 'ampersand_highlight'.lpad('&nbsp;', 19);
        return sys;
    }

    var chatBox = $("#robinSendMessage").find("input[type='text']");

    //bind prefix to the beginning of messages
    chatBox.next().on('click', function (event) {
        var message = chatBox.val();
        if (message.startsWith('/filter')) {
            var params = message.substring(8);
            var pfix;
            if (params.startsWith('set')) {
                var filt = params.substr(4).split(',');
                if (filt.length > 0) {
                    filter = filt;
                }
            } else if (params.startsWith('add')) {
                pfix = params.substring(4);
                if (pfix.length > 0) {
                    filter.push(pfix);
                }
            } else if (params.startsWith('del')) {
                pfix = params.substring(4);
                if (pfix.length > 0 && filter.indexOf(pfix) > -1) {
                    filter.splice(filter.indexOf(pfix), 1);
                }
            }
            chatBox.val('');
            event.cancel();
        } else if (message === '/channels') {
            var chans = seen_channels.join(', ');
            var mess = systemMessage("Seen Prefixes: " + chans);
            $("#robinChatMessageList").append(mess);
            chatBox.val('');
            event.cancel();
        } else if (message === '/plain') {
            if (filter.indexOf('') > -1) {
                filter.splice(filter.indexOf(''), 1);
                plain = false;
            } else {
                filter.push('');
                plain = true;
            }

            chatBox.val('');
            event.cancel();
        }
        var message_prefix = message.split(" ")[0];
        if (prefixes[message_prefix] !== undefined) {
            prefix = message_prefix;
        }
        if (message.startsWith(plain_prefix)) {
            chatBox.val(message.substring(plain_prefix.length).trim());
        } else if (!message.startsWith("/") && prefixes[message_prefix] === undefined) {
            chatBox.val(prefix + " " + message);
        }
    });
})();