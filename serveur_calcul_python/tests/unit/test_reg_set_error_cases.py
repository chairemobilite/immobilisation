"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing validation error cases for regulation sets
These functions were devised in such a way as to test the various 
validation steps. Spurions parking regulation sets are generated to ensure 
that the various incompatible cases raise the expected error or don't

"""
# external libraries
import pytest
# internal functions
import tests.data_gen.regulation_set_data_store as RSDS
import tests.data_gen.erroneous_reg_set_data_store as ERSDS

def test_minimum_land_use_not_specified():
    """
    # test_minimum_land_use_not_specified
    Checks that an error is raised during validation when 
    oland use codes 1 through 9 inclusively are not provided as a minimum
    """
    with pytest.raises(ValueError) as excinfo:
        prs = ERSDS.generate_reg_set_without_minimum_fill()
        prs.validate()
    assert "minimum_land_use_codes_not_provided" in str(excinfo.value)
"""
# 5 cases for end date
definitions
H hi value of date eg 2020
L lo value of date eg 2005
S still valid ie None
|  REG set | reg  | Pass/fail| case #
|----------|------|----------|--------|   
|     H    |   L  |  Fail    | 1      |test_temporal_end_year_reg_2000_reg_set_2020 
|    L     |   H  |  pass    |  2     |test_temporal_end_year_reg_2000_reg_set_1995
|    S     |   S  |   pass   |  3     |test_temporal_end_year_both_still_valid
|    S     |L or H| fail     |  3     |test_temporal_end_year_reg_still_valid_reg_set_2020
| L or H   |   S  |   pass   |  4     |test_temporal_end_year_reg_2000_reg_set_still_valid
"""
def test_temporal_end_year_reg_2000_reg_set_2020():
    """
    # test_temporal_end_year_reg_2000_reg_set_2020
    Tests case when the reg set is valid after one of its regulations has expired. This 
    should raise an error
    """
    with pytest.raises(ValueError) as excinfo:
        prs = ERSDS.generate_reg_set_with_reg_2000_reg_set_2020()# reg 2000, regset2020
        prs.validate()
    assert "incompatible_reg_set_dates" in str(excinfo.value)# should fail

def test_temporal_end_year_reg_2000_reg_set_1995():
    """
    # test_temporal_end_year_reg_2000_reg_set_1995
    Checks that no errors are raised when the regulation lasts longer
    than the regulation set
    """
    prs,_,_,_= RSDS.generate_parking_regulation_sets()
    prs.validate()

def test_temporal_end_year_both_still_valid():
    """
    # test_temporal_end_year_both_still_valid
    Test case where the regulation and regulation are both still valid
    whichi should not raise an error. Regulations and regulation sets which
    are still valid should not have any end date specified which means they
    """
    prs= ERSDS.generate_reg_set_with_reg_still_valid_reg_set_still_valid()
    prs.validate()

def test_temporal_end_year_reg_still_valid_reg_set_2020():
    """
    # test_temporal_end_year_reg_still_valid_reg_set_2020
    CHecks the case when the regulation is still valid but the regulation
    set is not. This shoudl pass validation
    """
    prs= ERSDS.generate_reg_set_with_reg_still_valid_reg_set_ends()
    prs.validate()

def test_temporal_end_year_reg_2000_reg_set_still_valid():
    """
    # test_temporal_end_year_reg_2000_reg_set_still_valid
    Tests case when the regulation has ended but the regulation set is still valid
    which should raise an error
    """
    with pytest.raises(ValueError) as excinfo:
        prs = ERSDS.generate_reg_set_with_reg_ends_before_reg_set_still_valid()
        prs.validate()
    assert "incompatible_reg_set_dates" in str(excinfo.value)

"""
5 cases for start date
definitions
H hi value of date eg 1990
L lo value of date eg 1985
E Eternal ie None ie no start date, usually to cover periods before minimums appear
|  Reg set | reg  | Pass/fail| case #
|----------|------|----------|--------|   
|    L     |   H  |  Fail    | 1      |test_temporal_start_year_reg_1990_reg_set_1989 
|    H     |   L  |  pass    |  2     |test_temporal_start_year_reg_1990_reg_set_1991
|    S     |   S  |   pass   |  3     |test_temporal_start_year_reg_eternal_reg_set_eternal
|    S     |L or H| fail     |  3     |test_temporal_start_year_1990_reg_set_eternal
| L or H   |   S  |   pass   |  4     |test_temporal_reg_eternal_reg_set_1990
"""
def test_temporal_start_year_reg_1990_reg_set_1989():
    """
    # test_temporal_start_year_reg_1990_reg_set_1989
    Tests case where reg_set starts before the year where the regulation is created which 
    should raise an error
    """
    with pytest.raises(ValueError) as excinfo:
        prs = ERSDS.generate_reg_set_with_reg_start_1990_reg_set_1989()# reg 2000, regset2020
        prs.validate()
    assert "incompatible_reg_set_dates" in str(excinfo.value)# should fail

def test_temporal_start_year_reg_1990_reg_set_1991():
    """
    # test_temporal_start_year_reg_1990_reg_set_1991
    Tests case where regulation set starts after the year where the regulation
    was enacted which should not raise any errors
    """
    prs= ERSDS.generate_reg_set_with_reg_start_1990_reg_set_1991()
    prs.validate() 

def test_temporal_start_year_reg_eternal_reg_set_eternal():
    """
    # test_temporal_start_year_reg_eternal_reg_set_eternal
    Tests case where both the regulation and regulation set have no start date. THis is for filler
    regulations that occur before minimums were created.
    """
    prs = ERSDS.generate_reg_set_with_reg_start_big_bang_reg_set_big_bang()
    prs.validate()

def test_temporal_start_year_1990_reg_set_eternal():
    """
    # test_temporal_start_year_1990_reg_set_eternal
    Tests case where the regulation has a start date but the regulation set should span 
    forever before the end date. This should raise and error because a specified regulation
    is not valid for a period
    """
    with pytest.raises(ValueError) as excinfo:
        prs = ERSDS.generate_reg_set_with_reg_start_1990_reg_set_big_bang()
        prs.validate()
    assert "incompatible_reg_set_dates" in str(excinfo.value)# should fail

def test_temporal_reg_eternal_reg_set_1990():
    """
    # test_temporal_reg_eternal_reg_set_1990
    This tests case where the regulation is one that lasts forever before a date
    but the regulation set has a real start date which should pass validation
    """
    prs= ERSDS.generate_reg_set_with_reg_start_big_bang_reg_set_1990()
    prs.validate()