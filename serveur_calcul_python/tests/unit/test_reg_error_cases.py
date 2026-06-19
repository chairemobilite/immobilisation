"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing regulation validation errors
this function checks that potential validation errors are raised 
as expected in the validation step. To do so various incorrect 
regulation definitons were created to raise errors at the validation 
stage.
"""
# external libraries
import pytest
# internal libraries
import tests.data_gen.erroneous_reg_data_store as ERDS

"""Cases where the slope and intercept are set to all None which is invalid """
def test_all_none_values_simple_rule():
    """
    # test_all_none_values
    Tests whether an error is thrown when all the values are none in the regulation definition
    """
    park_reg = ERDS.generate_none_simple_regulation()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_math_definition" in str(excinfo.value)

def test_all_none_thresh_rule():
    """
    # test_all_none_thresh_rule
    Tests whether error is raised when a threshold rule has one line with all none values for slopes and intercepts
    """

    park_reg = ERDS.generate_none_thresh_regulation()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_math_definition" in str(excinfo.value)

def test_all_none_addition_rule():
    """
    # test_all_none_addition_rule
    Checks whether an error is raised when one of the rows of rule definition in an addition based rule contains all nones
    """
    park_reg=ERDS.generate_none_add_regulation()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_math_definition" in str(excinfo.value)

"""
Test cases where operators are incorrectly specified. This is a case which is likely to 
occur with inexperienced analysts because the manual entry form is not the most robust
"""


def test_incorrect_inter_oper_simple():
    """
        # test_all_invalid_inter_operator
        test what happens when I generate an operator between two subsets which is a string to 
        ensure that typeguard raises error
    """
    park_reg = ERDS.generate_incorrect_inter_oper_simple()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_inter_subset_operator" in str(excinfo.value)

def test_incorrect_inter_oper_comp():
    """
        # test_all_invalid_inter_operator
        test what happens when I generate an operator between two subsets which is a string to 
        ensure that typeguard raises error
    """
    park_reg = ERDS.generate_incorrect_inter_oper_comp()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_inter_subset_operator" in str(excinfo.value)

def test_multiple_intra_oper():
    """
    # test_multiple_intra_oper
    Tests the case where ther are multiple operators for the intra operation (i.e. defining
    add or threshold based operation)
    """
    park_reg = ERDS.generate_incorrect_intra_ops_multiple()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_intra_operator_rule" in str(excinfo.value)

def test_incorrect_intra_ops():
    """
    # test_incorrect_intra_ops
    Tests whether there are operators being use which aren't properly defined. The valid 
    operators are 1 and 4 and there can only be one operator per subset
    """
    park_reg = ERDS.generate_incorrect_intra_ops_invalid()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "invalid_intra_operator_rule" in str(excinfo.value)

def test_missing_units():
    """
    # test_missing_units
    Check whether validation runs raises error when a regulation 
    doesn't include the required units for computation
    """
    park_reg = ERDS.generate_missing_units()
    with pytest.raises(ValueError) as excinfo:
        park_reg.validate()
    assert "missing_units" in str(excinfo.value)