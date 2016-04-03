// ==UserScript==
// @name         % Highlight
// @namespace    http://tampermonkey.net/
// @version      2.4
// @description  No spam please!
// @author       /u/tuvior
// @include      https://www.reddit.com/robin*
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js
// @downloadURL  https://raw.githubusercontent.com/tuvior/ampersand_highlight/master/ampersand_highlight.user.js
// @grant        GM_getValue
// ==/UserScript==
(function () {

    //add names of the bad guys here
    var badMonkeys = [
        'chapebrone'
    ];

    //change this for your cool groups
    var prefix = '%';

    //trivia hosts
    var triviaHosts = [
        'dthunder',
        'nbagf'
    ];

    var prefixes = {
        "%": "rgba(255,165,0,.3)",
        "#": "rgba(165,255,0,.3)",
        "$": "rgba(0,165,255,.3)",
        "&": "rgba(0,255,165,.3)",
        "^": "rgba(165,0,255,.3)",
    };

    //our name
    var username = $('div#header span.user a').html();

    //trivia prefix
    var t_prefix = '~';
    var plain_prefix = '-';

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
        var msg = msgItem["0"].getElementsByClassName("robin-message--message")[0].innerHTML;
        var name = msgItem["0"].getElementsByClassName("robin-message--from robin--username")[0].innerHTML;

        if (prefixes[msg.charAt(0)] !== undefined && $.inArray(name, badMonkeys) < 0) {
            msgItem["0"].getElementsByClassName("robin-message--message")[0].innerHTML = msg.substring(1).trim();
            msgItem["0"].getElementsByClassName("robin-message--from robin--username")[0].innerHTML = '[' + msg[0] + '] ' + name;
            msgItem.css({
                background: prefixes[msg.charAt(0)],
                color: 'black',
                "font-weight": 'bold'
            });

            if (msg.toLowerCase().contains(username.toLowerCase()) && name !== username) {
                msgItem.css({
                    color: 'red'
                });
            }
        } else if (msg.startsWith(t_prefix) && $.inArray(name, badMonkeys) < 0) {
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
                    color: 'black'
                });

                if (name === username) {
                    msgItem.css({
                        "font-weight": 'bold'
                    });
                }
            }
        }
    }

    var chatBox = $("#robinSendMessage").find("input[type='text']");

    //bind prefix to the beginning of messages
    chatBox.next().on('click', function () {
        var message = chatBox.val();
        var message_prefix = message[0];
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