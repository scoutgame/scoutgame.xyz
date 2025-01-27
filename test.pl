
application/perl getuserinformation.pl ( Perl script, ASCII text executable )

#!/usr/bin/perl
use lib ".";
use CGI::Carp qw(fatalsToBrowser);
use CGI qw(:standard);
use cdb;

my $dbh = cdb::connect();
my $q = new CGI;

# All form data returned to me in a nice
# hashref, keyed off the form input fields

my $form = parse_form($q);

require("colors.inc");

print $q->header('text/html');
htmlheader();

###################################
## Get input data from form      ##
###################################
$facilitator = $form->{'facilitator'} || 0;

$userid = $form->{'userid'};
$username = $form->{'username'};
$useremail = $form->{'useremail'};
$payment = $form->{'payment'};
$passwordclue = $form->{'passwordclue'};
$userpassword = $form->{'userpassword'};
if ($userpassword eq "") {
	$userpassword = $form->{'password'};
}
$reportaccess = $form->{'reportaccess'};
$vendorpaid = $form->{'vendorpaid'};
$vendorname = $form->{'vendorname'};
$vendorpassword = $form->{'vendorpassword'};
$profiletype  = $form->{'profiletype'};
$profiletype = 'map' if ($profiletype eq 'core');
$profiletype = lc($profiletype);
## TMC 12/24/07 if path type Y report displays Path colors
$pathtype = $form->{ 'pathtype' };
$payment = $form->{'payment'};
$businessname = $form->{'businessname'};

my $user = get_user_info($dbh,$username,$userpassword);

my $exists_message = q{
	<p>The user name and password combination you entered already exists in the database.</p>
	<p>If you are restarting an existing profile <A HREF="../profilerestart.htm">click here</A>.</p>
	<p>If you are starting a new profile, <A HREF="JavaScript:history.back()">click here</A> to select another user name or password.</p>
};

my $exists = 0;
foreach my $profile (@{$user}) {
	if ($profiletype eq $profile->{profilechoice}) {
		$exists = 1;
	}
}

if ($exists == 1) {
	return_error($exists_message);
}
else {
	userbody($dbh,$user);
}

htmlfooter;
exit(0);

#######################
## print allreports  ##
#######################
sub userbody {
	my $dbh = shift;
	my $user = shift;

	print "<FONT face=\"$fontface\" COLOR=$black>";
	print "<table width = 550 border = 0>";
	print "<tr>\n";
	print "\t<td colspan=2><FONT face=\"$fontface\" SIZE=+2 COLOR=$red>";
	print "<b>Welcome to CORE Dimensions<P>\n\n";
	print "<b>IMPORTANT</b>\n";
	print "<FONT FACE=\"$fontface\" SIZE=+0 COLOR=$black><br><b><i>";
	print "Birthdate and Gender are REQUIRED fields for the user table to generate properly. ";
	print "All other information is optional, but we would greatly appreciate your input.<P>\n\n";
	print "Our ongoing research makes the CORE profile the most accurate and ";
	print "reliable instrument available.  The information requested on this page will be used for scientific research purposes only.<P>\n\n";
	print "All information provided will be held in strictest confidence. <br />\nIt will not be sold";
	print " or distributed in any way to outside parties.<br />\n<br />\n</td>\n</tr>\n<tr>\n";
	print "\t<td width=25>Name:  </td>\n\t<td><b>$username</B><br />\n</td>\n</tr>\n<tr>\n";
	print "\t<td>E-mail:</td>\n\t<td><b>$useremail</b><br />\n</td>\n</tr>\n";
	print "\t<td>Business Name:</td>\n\t<td><b>$businessname</b><br />\n</td>\n</tr>\n" if ($businessname ne "");

	print "</table>\n\n";

print qq~
<SCRIPT>
function fixyear(y) {
	y.value = '19' + y.value;
}
function checkprofile(form) {
	form.mySubmit.disabled=true;
}
</SCRIPT>
~;

	print "<table width = 550 border = 0><tr>\n";
	print qq~\t<td colspan=2>\n~;
	print qq~<FORM ACTION=updateuserinfo.pl method=POST\n\tonsubmit="return checkprofile(document.forms[0])"\n>\n~;
	print "\t\t<input type=hidden NAME='facilitator' value=\"$facilitator\" />\n";
	print "\t\t<input type=hidden NAME='recipient' value=\"profiles\@coremap.com\" />\n";
	print "\t\t<input type=hidden NAME='webtester' value=\"profiles\@coremap.com\" />\n";
	print "\t\t<input type=hidden NAME='subject' value=\"CORE Profile Payment\" />\n";
	print "\t\t<input type=hidden NAME='thankurl' value=\"https://www.coremap.com/ppthankyou.html\" />\n";
	print "\t\t<input type=hidden NAME='userid' value=\"$userid\" />\n" if ($userid ne "");
	print "\t\t<input type=hidden NAME='username' value=\"$username\" />\n";
	print "\t\t<input type=hidden NAME='userpassword' value=\"$userpassword\" />\n";
	print "\t\t<input type=hidden NAME='passwordclue' value=\"$passwordclue\" />\n";
	print "\t\t<input type=hidden NAME='useremail' value=\"$useremail\" />\n";
	print "\t\t<input type=hidden NAME='reportaccess' value=\"$reportaccess\" />\n";
	print "\t\t<input type=hidden NAME='payment' value=\"$payment\" />\n";
	print "\t\t<input type=hidden NAME='companypaid' value=\"$vendorpaid\" />\n";
	print "\t\t<input type=hidden NAME='companyname' value=\"$vendorname\" />\n";
	print "\t\t<input type=hidden NAME='companypassword' value='$vendorpassword' />\n";
	print "\t\t<input type=hidden NAME='profiletype' value='$profiletype' />\n";
	print "\t\t<input type=hidden NAME='pathtype' value='$pathtype' />\n";
	print "\t\t<input type=hidden NAME='payment' value='$payment' />\n";
	print "\t\t<input type=hidden NAME='businessname' value='$businessname' />\n";

	print "\t</td>\n</tr>\n<tr>\n";
	print "\t<td>Address</td>\n\t<td>\t\t<input type=text NAME=address SIZE=50></td>\n</tr>\n<tr>\n";
	print "\t<td>City</td>\n\t<td>\t\t<input type=text NAME=city SIZE=50></td>\n</tr>\n<tr>\n";
	print "\t<td>State/Province: </td>\n \t<td>\t\t<input type=text NAME=state SIZE=20></td>\n</tr>\n<tr>\n";
	print "\t<td>Zip Code</td>\n \t<td>\t\t<input type=text NAME=zip SIZE=25></td>\n</tr>\n<tr>\n";
	print "\t<td>Phone:</td>\n \t<td>\t\t<input type=text NAME=phone></td>\n</tr>\n<tr>\n";
	print qq~\t<td>Birthday</td>\n \t<td>\t\t<input type=text NAME=birthmonth SIZE=2 onblur="if(this.value.length==1)this.value='0'+this.value;"> MM ~;
	print qq~\t\t<input type=text NAME=birthday SIZE=2 onblur="if(this.value.length==1)this.value='0'+this.value;"> DD ~;
	print qq~\t\t<input type=text NAME=birthyear SIZE=4 onblur="if(this.value.length==2)fixyear(this);"> YYYY </td>\n</tr>\n<tr>\n~;
	print "\t<td>Place of Birth</td>\n \t<td>\t\t<input type=text NAME=birthplace SIZE=50><br />\n<br />\n</td>\n</tr>\n<tr>\n";
	print "\t<td colspan=2><b>How did you hear about CORE Dimensions?</b><br />\n";
	print "\t\t<input type=text NAME=found-us-by SIZE=50><br />\n<br />\n</td>\n</tr>\n</table>";


	print "<table width = 600 border=0>";
	print "<tr>\n\t<td width=175></td>\n\t<td width=175></td>\n\t<td width=250></td>\n</tr>\n<tr>\n";
	print "\t<td valign=top>What is your gender?</td>\n";
	print "\t<td colspan=2>\n\t\t<input type=radio NAME=gender value=\"MALE\" /> Male \n";
	print "\t\t<input type=radio NAME=gender value=\"FEMALE\" /> Female<br />\n<br />\n </td>\n</tr>\n<tr>\n";

	print "\t<td valign=top>What is your highest level of education ?</td>\n";
	print "\t<td valign=top bgCOLOR=\"#BABABA\">\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"G.E.D.\"> G.E.D. <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"High School\"> High School <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Associates Degree\"> Associates Degree <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Bachelors Degree\"> Bachelors Degree <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Masters Degree\"> Masters Degree <br />\n</td>\n\t<td bgCOLOR=\"#BABABA\">";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Ph.D.\"> Ph.D. / Doctorate <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Correspondence School\"> Correspondence School <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Trade School\"> Trade School <br />\n";
	print "\t\t<input type=radio NAME=highestgradelevel value=\"Other\"> Other Specify:<br />\n";
	print "\t\t<input type=text  NAME=highestgradelevel-other><br />\n </td>\n</tr>\n<tr>\n";
	print "\t<td>Type of degree or specialization: </td>\n";
	print "\t<td colspan=2 bgCOLOR=\"#BABABA\"><center><br />\n\t\t<input type=text NAME=degree SIZE=50></center><br />\n</td>\n</tr>\n<tr>\n";
	print "\t<td colspan=3><br />\n</td>\n</tr>\n";
	print "\n</table>";
	print "<table width = 600 border=0><tr>\n\t<td width=200></td>\n\t<td width=200></td>\n\t<td width=200></td>\n</tr>\n<tr>\n";
	print "\t<td colspan = 3><br />\n<b>Which of the following best describes your current profession?</b></td>\n</tr>\n<tr>\n";
	print "\t<td valign=top bgCOLOR=\"#BABABA\"><FONT FACE=\"$fontface\" SIZE=-1>";
	print "\t\t<input type=radio NAME=profession value=\"Accounting/Bookkeeper\" /> Accounting/Bookkeeper<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Art/Performance\" /> Art/Performance<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Business Services\" /> Business Services<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Communications\" /> Communications<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Construction\" /> Construction<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Consultant/Coach\" /> Consultant/Coach<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Counselor/Therapist\" /> Counselor/Therapist<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Education\" /> Education<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Engineering/Design\" /> Engineering/Design<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Finance/Banking\" /> Finance/Banking<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Fitness/Health\" /> Fitness/Health<br />\n";
	print "</td>\n\t<td valign=top bgCOLOR=\"#BABABA\"><FONT face=\"$fontface\" SIZE=-1>";
	print "\t\t<input type=radio NAME=profession value=\"Food Services\" /> Food Services<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Government\" /> Government<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Hospitality\" /> Hospitality<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Insurance\" /> Insurance<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Legal Services\" /> Legal Services<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Manufacturing\" /> Manufacturing<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Marketing/Sales\" /> Marketing/Sales<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Medical/Health Care\" /> Medical/Health Care<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Public Relations\" /> Public Relations<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Public Service\" /> Public Service<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Publishing/Broadcasting\" /> Publishing/Broadcasting<br />\n";
	print "\t<td valign=top bgCOLOR=\"#BABABA\"> <FONT FACE=\"$fontface\" SIZE=-1>";
	print "\t\t<input type=radio NAME=profession value=\"Real Estate\" /> Real Estate<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Research and Development\" /> Research and Development<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Retail/Wholesale\" /> Retail/Wholesale<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Science\" /> Science<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Service Related\" /> Service Related<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Speaker/Trainer\" /> Speaker/Trainer<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Technician\" /> Technician<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Technology\" /> Technology<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Transportion\" /> Transportation<br />\n";
	print "\t\t<input type=radio NAME=profession value=\"Other (please specify)\" /> Other (please specify)<br />\n";
	print "\t\t<input type=text NAME=profession-other ><br />\n<br />\n";
	print "</td>\n</tr>\n<tr>\n";

	print "\t<td colspan = 3><br />\n<br />\n<b>What best describes the position you hold within your profession?</b> </td>\n</tr>\n<tr>\n";
	print "\t<td valign=top bgCOLOR=\"#BABABA\"> <FONT FACE=\"$fontface\" SIZE=-1>";
	print "\t\t<input type =checkbox NAME=jobfunction value=3> CEO/President/Owner<br />\n";
	print "\t\t<input type =checkbox NAME=jobfunction value=4>Co-owner/Partner<br />\n";
	print "\t\t<input type =checkbox NAME=jobfunction value=10> VP/Director<br />\n";
	print "\t\t<input type =checkbox NAME=jobfunction value=5>Manager<br />\n";
	print "\t<td colspan=2 valign = top bgCOLOR=\"#BABABA\"> <FONT FACE=\"$fontface\" SIZE=-1>";
	print "\t\t<input type =checkbox NAME=jobfunction value=7>Supervisor<br />\n";
	print "\t\t<input type =checkbox NAME=jobfunction value=8>Employee<br />\n";
	print "\t\t<input type =checkbox NAME=jobfunction value=11>   Other(please specify)<br />\n";
	print "\t\t<input type =text     NAME=jobfunction-other></td>\n</tr>\n<tr>\n";

	print "\t<td colspan = 3> <br />\n<br />\n<b>Which of the following best describe your leisure time activities and hobbies?</b> (Check all that apply)</td>\n";
	print "</tr>\n";

	my $query = q{ SELECT hobbyid, name FROM hobby ORDER BY name };
	my $sth = $dbh->prepare( $query ) or die($DBI::errstr);
	$sth->execute() or die($DBI::errstr);
	my $hobbies = $sth->fetchall_arrayref({});

	$counter = 1;
	foreach my $hobby (@{$hobbies}) {
		print "\t<td valign=top bgCOLOR=\"#BABABA\">" if ($counter == 1);
		print "\t\t<input type=checkbox NAME=hobby value=$hobby->{hobbyid} /><FONT face=\"$fontface\" SIZE=-1>$hobby->{name}</FONT><br />\n";
		$counter++;
		if ($counter == 7) {
			$counter = 1;
			print "</td>\n";
		}
	}
	print "</tr>\n";
	print "<tr><td COLSPAN=3 bgCOLOR=\"#BABABA\">\n";
	print "\t\t<input type=checkbox NAME=hobby value=15>Other (please specify) ";
	print "\t\t<input type=text NAME=hobby-other></td>\n</tr>\n<tr>\n";

print"\t<td colspan =3><br />\n<br />\n<b>Select one or more Ethnic/Racial designations:</b><br />\n</td>\n</tr>\n<tr>\n";
print"\t<td colspan = 3>";
print"<I>This information helps us ensure that the profile is culturally unbiased.</I></td>\n</tr>\n<tr>\n";
print"\t<td colspan = 3 bgCOLOR=\"#BABABA\">\t\t";

print qq~
<TABLE BORDER=0>
<tr>
	<td VALIGN=top>
		<input type=radio NAME=ethnicgroup value='American Indian'>
	</td>
	<td>
		<b>American Indian/Alaska Native</b> (having origins in any of the original peoples of North and South America, and who maintains tribal affiliation or community attachment)
	</td>
</tr>
<tr>
	<td VALIGN=top>
		<input type=radio NAME=ethnicgroup value='Asian' />
	</td>
	<td>
		<b>Asian</b> (having origins in any of the original peoples of the Far East, Southeast Asia, or the Indian subcontinent including, for example, Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippines, Thailand, and Vietnam)
	</td>
</tr>
<tr>
	<td VALIGN=top>
		<input type=radio NAME=ethnicgroup value='Black/African' />
	</td>
	<td>
		<b>Black/African</b> (non-Hispanic peoples having origins in any of the black racial groups of Africa)
	</td>
</tr>
<tr>
	<td VALIGN=top>
		<input type=radio NAME=ethnicgroup value='Caucasian/White' />
	</td>
	<td>
		<b>Caucasian/White</b> (having origins in any of the original peoples of Europe, the Middle East, or North Africa)
	</td>
</tr>
<tr>
	<td VALIGN=top>
		<input type=radio NAME=ethnicgroup value='Hispanic/Latino' />
	</td>
	<td>
		<b>Hispanic/Latino</b> (having Spanish origins such as in Cuba, Mexico, Puerto Rico, South or Central American, etc., regardless of race)
	</td>
</tr>
<tr>
	<td VALIGN=top>
		<input type=radio NAME=ethnicgroup value='Other' />
	</td>
	<td>
		<b>Other</b>, please specify: <input type= text NAME=ethnicgroup-othersize=30 />
	</td>
</tr>
</TABLE>
</td>
</tr>
<tr>
~;

print"\t<td colspan = 3 bgCOLOR=\"#BABABA\">\t\t";
print "<b>Further define your Ethnic/Racial origin</b> (example: American, Canadian, Chinese, European, Lebanese, Japanese, Mexican, Puerto Rican, etc.)<br>\n";
print "&nbsp;<input type=text NAME=ethnicgroup-origin SIZE=30><br><br>\n";
print "</td></tr><tr>\n";
print "\t<td colspan = 3> <b><br />\n<br />\nOn a scale of 1-10, how satisfied
are you with your current job or profession ?</b><br> (1 being
not satisfied at all, 10 extremely satisfied)<br />\n<br />\n";


print qq~
	<CENTER>
		<input type=radio NAME=jobhappyness value="1"> 1
		<input type=radio NAME=jobhappyness value="2"> 2
		<input type=radio NAME=jobhappyness value="3"> 3
		<input type=radio NAME=jobhappyness value="4"> 4
		<input type=radio NAME=jobhappyness value="5"> 5
		<input type=radio NAME=jobhappyness value="6"> 6
		<input type=radio NAME=jobhappyness value="7"> 7
		<input type=radio NAME=jobhappyness value="8"> 8
		<input type=radio NAME=jobhappyness value="9"> 9
		<input type=radio NAME=jobhappyness value="10"> 10
	</CENTER>
	</td>
</tr>
<tr>
	<td colspan=3>
&nbsp;<br />
<b>On a scale of 1-10, how satisfied are you with your current lifestyle ?</b> <br>(1 being not satisfied at all, 10 extremely satisfied)<br />\n<br />

<CENTER>
	<input type=radio NAME=lifehappyness value="1"> 1
	<input type=radio NAME=lifehappyness value="2"> 2
	<input type=radio NAME=lifehappyness value="3"> 3
	<input type=radio NAME=lifehappyness value="4"> 4
	<input type=radio NAME=lifehappyness value="5"> 5
	<input type=radio NAME=lifehappyness value="6"> 6
	<input type=radio NAME=lifehappyness value="7"> 7
	<input type=radio NAME=lifehappyness value="8"> 8
	<input type=radio NAME=lifehappyness value="9"> 9
	<input type=radio NAME=lifehappyness value="10"> 10
</CENTER>
</td>
</tr>
<tr></TABLE>
~;


print"</tr>\n</table>";

print "<table width=550><tr>\n";
print "\t<td colspan=2>";
print "</td>\n</tr>\n<tr>\n";

print "\t<td width = 150 valign=top><b>Where did you<br />grow up?</b></td>\n";
print "\t<td>";
print "\t\t<input type=radio NAME=growup value=\"1\" /> Metropolitan (in a large city)<br />\n";
print "\t\t<input type=radio NAME=growup value=\"2\" /> Suburban (on the outskirts of a large city)<br />\n";
print "\t\t<input type=radio NAME=growup value=\"3\" /> Town (in a small city to mid-size town)<br />\n";
print "\t\t<input type=radio NAME=growup value=\"4\" /> Rural (farm community / sparsely populated area)<br />\n<br />\n</td>\n</tr>\n";
print "<tr>\n\t<td width = 150 valign=top><b>Where do you<br />live now?</b></td>\n";
print "\t<td>";
print "\t\t<input type=radio NAME=livenow value=\"1\" /> Metropolitan (in a large city)<br />\n";
print "\t\t<input type=radio NAME=livenow value=\"2\" /> Suburban (on the outskirts of a large city)<br />\n";
print "\t\t<input type=radio NAME=livenow value=\"3\" /> Town (in a small to mid-size town)<br />\n";
print "\t\t<input type=radio NAME=livenow value=\"4\" /> Rural (farm community / sparsely populated area)<br />\n<br />\n</td>\n</tr>\n<tr>\n";

	if ($profiletype eq 'core' || $profiletype eq 'map' || $profiletype eq 'path-map'){
		print qq~<tr>\n\t<td colspan=2><center><input type=submit NAME=mySubmit value='Take the CORE PROFILE now' onClick="return (!this.disabled)" /></center></FORM></td>\n~;
	} elsif ($profiletype eq 'ace') {
		print qq~<tr>\n\t<td colspan=2><center><input type=submit NAME=mySubmit value='Take the ACE PROFILE now' onClick="return (!this.disabled)" /></center></FORM></td>\n~;
	} elsif ($profiletype eq 'path') {
		print qq~<tr>\n\t<td colspan=2><center><input type=submit NAME=mySubmit value='Take the PATH PROFILE now' onClick="return (!this.disabled)" /></center></FORM></td>\n~;
	} else {
		print "<tr>\n\t<td colspan=2><center>\n";
		print qq~<input type=submit NAME=mySubmit value='Take the PEP Profile now' onClick="return (!this.disabled)" />\n~;
		print "</center></FORM></td>\n";
	}
	print "</tr>\n</table>\n";

}

##======================================================##
# HTML Header

sub htmlheader {
	print qq{<html>
		<head>
		<title>$ENV{SCRIPT_NAME}</title>
		</head>
		<style>
		BODY {
			font-family : arial,sans-serif;
			color : #00000;
			margin : 10px;
			background-color : #fff8db;
		}
		H1 { color:#336699; }
		H2 { color:#336699; }
		H3 { color:#336699; }
		.error { font-weight:bold;color:#ff0000; }
		</style>
		<body>
	};
}

##======================================================##
# HTML Footer

sub htmlfooter {
	print q{
		</body>
		</html>
	};
}

##======================================================##
#

sub get_user_info {
	my $dbh = shift;
	my $username = shift;
	my $password = shift;

	my $query = q{
		SELECT u.userid, up.profilechoice
		FROM user u, userprofile up
		WHERE binary username = ?
		AND binary password = ?
	};

	$sth = $dbh->prepare( $query ) or die($DBI::errstr);
	$sth->execute( $username,$password ) or die($DBI::errstr);
	my $user = $sth->fetchall_arrayref({});
	$sth->finish();

	return $user;
}

##======================================================##
# Error reporting

sub return_error {
	my $error = shift;
	print qq{
		<h2 class='error'>An Error has Occurred</h2>
		$error
		<p><a href='javascript:history.back()'>Go back</a></p>
	};
	exit();
}

##======================================================##
# Parse the form input and place it in it's own object.
# With some modification, this will eventually be placed
# in a global module for use by all the scripts of this
# site.  Until that day comes, it'll have it's testing
# ground here.
#
# All the form fields are keyed off their corresponding
# database column.  This makes it extremely easy to build
# the SQL statement later on, and also makes it easy to
# remember what goes where.  It just makes sense... why
# *wouldn't* anyone do it this way whenever possible?

sub parse_form {
	my $q = shift;

	my $form = {};
	foreach my $key ( $q->param() ) {
		$form->{$key} = $q->param($key);
	}
	my @db_columns = $q->param('db_columns');
	$form->{db_columns} = \@db_columns;

	return $form;
}

