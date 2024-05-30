import requests
import requests.exceptions as rexcepts
from docopt import docopt


import logging
import traceback
import time
import re
import os
from enum import IntEnum
from urllib.parse import urlparse
from typing import List, Tuple, Optional, Dict, Any
from concurrent.futures import TimeoutError as CTimeoutError


# Cookiebot CDN domain
cb_base_pat = re.compile("https://consent\\.cookiebot\\.(com|eu)/")
cb_script_name = re.compile("cb-main\\.js")  # for websites the load CB dynamically

# OneTrust CDNs
onetrust_pattern_A = re.compile("(https://cdn-apac\\.onetrust\\.com)")
onetrust_pattern_B = re.compile("(https://cdn-ukwest\\.onetrust\\.com)")
cookielaw_base_pattern = re.compile("(https://cdn\\.cookielaw\\.org)")
cmp_cookielaw_base_pattern = re.compile("(https://cmp-cdn\\.cookielaw\\.org)")
optanon_base_pattern = re.compile("(https://optanon\\.blob\\.core\\.windows\\.net)")
cookiecdn_base_pattern = re.compile("(https://cookie-cdn\\.cookiepro\\.com)")
cookiepro_base_pattern = re.compile("(https://cookiepro\\.blob\\.core\\.windows\\.net)")

# Tuple of the above, for iteration
onetrust_patterns: Tuple = (onetrust_pattern_A, onetrust_pattern_B, cmp_cookielaw_base_pattern,
                            cookielaw_base_pattern, optanon_base_pattern,
                            cookiecdn_base_pattern, cookiepro_base_pattern)

# Termly CDN domain
termly_url_pattern = re.compile("https://app\\.termly\\.io/")


def check_cookiebot_presence(resp: requests.Response) -> bool:
    """ Check whether Cookiebot is referenced on the website """
    psource = resp.text
    matchobj1 = cb_base_pat.search(psource, re.IGNORECASE)
    matchobj2 = cb_script_name.search(psource, re.IGNORECASE)
    return matchobj1 is not None or matchobj2 is not None


def check_onetrust_presence(resp: requests.Response) -> bool:
    """ Check whether a OneTrust pattern is referenced on the website """
    psource = resp.text
    found = False
    ot_iters = iter(onetrust_patterns)
    try:
        while not found:
            pattern = next(ot_iters)
            found = pattern.search(psource, re.IGNORECASE) is not None
    except StopIteration:
        found = False

    return found


def check_termly_presence(resp: requests.Response) -> bool:
    """ Check whether a Termly pattern is referenced on the website """
    psource = resp.text
    matchobj = termly_url_pattern.search(psource, re.IGNORECASE)
    return matchobj is not None


def run_reachability_check(input_domain: str) -> Tuple[Optional[str], int]:
    """
    Try to retrieve the webpage at the given domain, which need not be
    a valid HTTP schema URL. Instead, the script assumes this to be a
    website domain, and will attempt different HTTP schema variants to connect.

    Any connection, SSL error or HTTP error code excluding 403 and 406
    will result in the URL being filtered out.

    @param input_domain: domain to attempt to connect to, via HTTPS/HTTP
    @return: Tuple of two values:
            1. final URL the browser ended up at, after redirects
            2. Status of the connection.
               Either OK, HTTP Error, Connection Failure, or Bot Response
    """
    # If URL already has the HTTP schema, use that.
    # If not, try 3 different potential schemes
    component_tuple = urlparse(input_domain)
    if component_tuple[0] == "http" or component_tuple[0] == "https":
        url_suffix = input_domain
        prefix_list = [""] # empty prefix
    else:
        url_suffix = re.sub("^www\\.", "", input_domain)
        prefix_list = ["https://www.", "https://", "http://"]

    final_url: Optional[str] = None

    r = None
    # we try prefixes until we don't get a connection error, or we run out of prefixes
    for prefix in prefix_list:
        completed_url = prefix + url_suffix

        try:
            # fake chrome user agent
            headers = {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36"}
            r = requests.get(completed_url, headers=headers)
        except (rexcepts.TooManyRedirects, rexcepts.SSLError,
                rexcepts.URLRequired, rexcepts.MissingSchema) as ex:
            return input_domain
        except (rexcepts.ConnectionError, rexcepts.Timeout) as ex:
            continue
        except Exception as ex:
            return input_domain


        if r is None:
            continue
        elif not r.ok:
            # Error 403 and 406 are common responses with bot detection
            # Assume this is a bot blocker response, and return completed url
            # We can later bypass this using Selenium
            if r.status_code == 403 or r.status_code == 406:
                
                return completed_url
            else:
                # If this occurs, the URL was likely correct, but site is broken, so we abort
                return completed_url
        else:
            final_url = r.url
            break

    # Check for the presence of a Consent Management Provider
    if final_url is not None:
        # Check Cookiebot
        found_cmp: bool = check_cookiebot_presence(r)
        if found_cmp:
            print("using Cookiebot")
            return final_url, "cookiebot"

        # Check OneTrust
        found_cmp = check_onetrust_presence(r)
        if found_cmp:
            print("using OneTrust")
            return final_url, "onetrust"

        # Check Termly
        found_cmp = check_termly_presence(r)
        if found_cmp:
            print("using Termly")
            return final_url, "termly"

        return final_url, found_cmp
    else:       
        return input_domain, None