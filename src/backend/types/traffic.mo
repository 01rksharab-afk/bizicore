module {
  // Source classification for a traffic event
  public type TrafficSource = { #internal; #external; #direct };

  // A single page-visit event
  public type TrafficEvent = {
    id         : Text;
    orgId      : Text;
    page       : Text;
    referrer   : Text;
    sourceType : TrafficSource;
    sessionId  : Text;
    timestamp  : Int;
    userId     : Text;
  };

  // Filter parameters for querying events
  public type TrafficQuery = {
    orgId      : Text;
    dateFrom   : ?Int;
    dateTo     : ?Int;
    sourceType : ?TrafficSource;
    page       : ?Text;
  };

  // Aggregated summary for a given org / day
  public type TrafficSummary = {
    totalToday    : Nat;
    internalToday : Nat;
    externalToday : Nat;
    directToday   : Nat;
    topPages      : [(Text, Nat)];
    topReferrers  : [(Text, Nat)];
  };
};
