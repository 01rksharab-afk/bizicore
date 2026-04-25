module {
  public type OrgId          = Text;
  public type NotificationId = Text;

  public type NotifType = {
    #System;
    #B2BSyncNotif;
    #Invoice;
    #GSTFiling;
  };

  public type Notification = {
    id        : NotificationId;
    userId    : Principal;
    orgId     : OrgId;
    notifType : NotifType;
    title     : Text;
    message   : Text;
    createdAt : Int;
    isRead    : Bool;
  };
};
