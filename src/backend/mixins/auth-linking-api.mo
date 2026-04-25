import Types "../types/auth-linking";
import Map "mo:core/Map";
import Array "mo:core/Array";
import List "mo:core/List";
import OutCall "mo:caffeineai-http-outcalls/outcall";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Char "mo:core/Char";

mixin (
  links : Map.Map<Principal, [Types.AuthLinkRecord]>,
  byExt : Map.Map<Text, Principal>,
  otps : Map.Map<Text, Types.OtpRecord>,
  twilioSid : { var value : Text },
  twilioToken : { var value : Text },
  twilioFrom : { var value : Text },
  transform : shared query OutCall.TransformationInput -> async OutCall.TransformationOutput,
) {

  public shared ({ caller }) func sendPhoneOtp(phone : Text) : async Text {
    let now = Time.now();
    let expiredKeys = List.empty<Text>();
    for ((k, r) in otps.entries()) {
      if (now > r.expiryTime) { expiredKeys.add(k) };
    };
    for (k in expiredKeys.values()) { otps.remove(k) };
    let code = makeOtp6();
    otps.add(phone, { phone; code; expiryTime = now + 300_000_000_000; principalText = caller.toText() });
    let sid = twilioSid.value;
    let tok = twilioToken.value;
    if (sid == "" or tok == "") { return "ok" };
    let bodyText = "To=" # phone # "&From=" # twilioFrom.value # "&Body=BizCore code: " # code;
    let authH = "Basic " # b64(sid # ":" # tok);
    let url = "https://api.twilio.com/2010-04-01/Accounts/" # sid # "/Messages.json";
    try {
      ignore await OutCall.httpPostRequest(url, [{ name = "Authorization"; value = authH }, { name = "Content-Type"; value = "application/x-www-form-urlencoded" }], bodyText, transform);
      "ok"
    } catch (_) { "err" }
  };

  public shared ({ caller }) func verifyPhoneOtp(phone : Text, code : Text) : async Text {
    switch (otps.get(phone)) {
      case null { "err:invalid" };
      case (?r) {
        if (Time.now() > r.expiryTime) { otps.remove(phone); "err:expired" }
        else if (r.code == code) {
          otps.remove(phone);
          let key = "p:" # phone;
          switch (byExt.get(key)) {
            case (?existing) { if (Principal.equal(existing, caller)) "ok:linked" else "err:invalid" };
            case null {
              let rec : Types.AuthLinkRecord = { principal = caller; method = "phone"; externalId = phone };
              let arr = switch (links.get(caller)) { case (?a) a; case null [] };
              let filtered = filterMethod(arr, "phone");
              links.add(caller, Array.tabulate<Types.AuthLinkRecord>(filtered.size() + 1, func(i) { if (i < filtered.size()) filtered[i] else rec }));
              byExt.add(key, caller);
              "ok:linked"
            };
          }
        } else { "err:invalid" }
      };
    }
  };

  public shared ({ caller }) func linkGoogleAccount(idToken : Text) : async Text {
    let url = "https://oauth2.googleapis.com/tokeninfo?id_token=" # idToken;
    try {
      let body = await OutCall.httpGetRequest(url, [], transform);
      switch (extractField(body, "sub")) {
        case null { "err" };
        case (?sub) {
          let key = "g:" # sub;
          switch (byExt.get(key)) {
            case (?existing) { if (Principal.equal(existing, caller)) "ok" else "err" };
            case null {
              let rec : Types.AuthLinkRecord = { principal = caller; method = "google"; externalId = sub };
              let arr = switch (links.get(caller)) { case (?a) a; case null [] };
              let filtered = filterMethod(arr, "google");
              links.add(caller, Array.tabulate<Types.AuthLinkRecord>(filtered.size() + 1, func(i) { if (i < filtered.size()) filtered[i] else rec }));
              byExt.add(key, caller);
              "ok"
            };
          }
        };
      }
    } catch (_) { "err" }
  };

  public shared query ({ caller }) func getLinkedIdentities() : async [Types.LinkedIdentity] {
    switch (links.get(caller)) {
      case null { [] };
      case (?arr) {
        Array.tabulate<Types.LinkedIdentity>(arr.size(), func(i) {
          { method = arr[i].method; externalId = arr[i].externalId }
        })
      };
    }
  };

  public shared ({ caller }) func unlinkIdentity(method : Text) : async Text {
    switch (links.get(caller)) {
      case null { "err:not_found" };
      case (?arr) {
        let found = arr.find(func(r : Types.AuthLinkRecord) : Bool { r.method == method });
        switch (found) {
          case null { "err:not_found" };
          case (?r) {
            let prefix = if (method == "google") "g:" else "p:";
            byExt.remove(prefix # r.externalId);
            let filtered = filterMethod(arr, method);
            if (filtered.size() == 0) { links.remove(caller) }
            else { links.add(caller, filtered) };
            "ok"
          };
        }
      };
    }
  };

  func filterMethod(arr : [Types.AuthLinkRecord], method : Text) : [Types.AuthLinkRecord] {
    arr.filter(func(r : Types.AuthLinkRecord) : Bool { r.method != method })
  };

  func makeOtp6() : Text {
    let n = Int.abs(Time.now()) % 1_000_000;
    let s = n.toText();
    let pad = 6 - s.size();
    var p = "";
    var i = 0;
    while (i < pad) { p #= "0"; i += 1 };
    p # s
  };

  func extractField(json : Text, field : Text) : ?Text {
    let needle = "\"" # field # "\":\"";
    let iter = json.split(#text(needle));
    ignore iter.next();
    switch (iter.next()) {
      case null null;
      case (?after) {
        var value = "";
        let dq = Char.fromNat32(34);
        label inner for (ch in after.toIter()) {
          if (Char.equal(ch, dq)) { break inner };
          value #= Text.fromChar(ch);
        };
        if (value == "") null else ?value
      };
    }
  };

  func b64(s : Text) : Text {
    let alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let ac = alpha.toArray();
    let bytes = s.encodeUtf8().toArray();
    var result = "";
    var i = 0;
    let len = bytes.size();
    while (i < len) {
      let b0 = bytes[i].toNat();
      let b1 = if (i + 1 < len) bytes[i + 1].toNat() else 0;
      let b2 = if (i + 2 < len) bytes[i + 2].toNat() else 0;
      result #= Text.fromChar(ac[b0 / 4]);
      result #= Text.fromChar(ac[(b0 % 4) * 16 + b1 / 16]);
      result #= Text.fromChar(if (i + 1 < len) ac[(b1 % 16) * 4 + b2 / 64] else '=');
      result #= Text.fromChar(if (i + 2 < len) ac[b2 % 64] else '=');
      i += 3;
    };
    result
  };
};
