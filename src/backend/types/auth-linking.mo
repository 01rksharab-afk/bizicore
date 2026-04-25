module {
  public type AuthLinkRecord = {
    principal : Principal;
    method : Text;
    externalId : Text;
  };
  public type OtpRecord = {
    phone : Text;
    code : Text;
    expiryTime : Int;
    principalText : Text;
  };
  public type LinkedIdentity = {
    method : Text;
    externalId : Text;
  };
};
