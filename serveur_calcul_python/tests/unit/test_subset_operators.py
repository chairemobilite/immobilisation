"""
Copyright (c) 2026 Paul Charbonneau

Licensed under the MIT License.
See the LICENSE file in the project root for license information.

Testing of subset operators

When running parking supply calculations based on parking regulations 
there are sometimes rules definitions which have 2 or more definitons. 
Each definition is computed based on a subset definition and then the correct
value for parking minimum and maximum supply is selected based on the contents of 
the 2 subsets and te selected operator. This functions 

"""
# external libraries
import pandas as pd

# internal functions
from classes import parking_inventory as PI
import tests.data_gen.inventory_data_store as IDS

"""
Simple or tests

The simple or chooses the parking inventory which is of least constraint. In economic terms
you want to construct the lowest amount of parking possible. These types of regulations are set
up for things like assembly buildings where the definition can be as a function of square footage 
or the number of seats for example. There are only two test cases based on whether the left or 
right parking dataframe hase the highest minimum parking required. Two test cases are devised


"""

def test_min_left_smaller_min_right_simple_or():
    """
    # test_min_left_smaller_min_right_simple_or
    Tests the simple or case when the minimum supply in the left inventory 
    is smaller than the right inventory. Expected behaviour is that the 
    inventory with the lowest required minimum supply is selected
    """
    left_PI = IDS.generate_min_only_small_PI()
    right_PI = IDS.generate_min_only_large_PI()
    test_subject_1 = PI.subset_operation(left_PI,6,right_PI)
    expected_result= IDS.generate_so_left_small_expected_output()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)


def test_min_left_larger_min_right_simple_or():
    """
    # test_min_left_larger_min_right_simple_or
    Tests the simple or case when there are 2 minimums and the minimum in the 
    left inventory is larger than the right inventory. Expected behaviour is that the
    inventory with the lowest required minimum is selected
    """
    left_PI = IDS.generate_min_only_large_PI()
    right_PI = IDS.generate_min_only_small_PI()
    test_subject_1 = PI.subset_operation(left_PI,6,right_PI)
    expected_result=IDS.generate_so_right_small_expected_output()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)


"""
Most constraining or tests

The most constrianing or test takes the opposite tack to simple or tack whereby the largest minimum parking
value is selected. This operation can also be used to arbitrate between a max value and a min value in cases
where these can come into conflict. This typically when there is a ceiling on the number of spaces required. 
6 cases have been defined here:

|case                            | Minimum Left | Minimum Right |  Maximum Left | Maximum Right |   Outcome Min     |  Outcome max  |
|--------------------------------|--------------|---------------|---------------|---------------|-------------------|---------------|
|Both subset require minimums    | High         |    Low        |    None       | None          | High value select |    None       |
|Both subset require minimums    | Low          |    High       |    None       | None          | High value select |    None       |
|Left is minimum right is max    | low          |    None       |    None       | High          | Low value select  |  High Value   |
|Left is minimum right is max    | high         |    None       |    None       | Low           | Low value select  |  Low value    |
|Left is maximum right is min    | None         |    High       |    Low        | None          | Low value select  |  Low value    |
|Left is maximum right is min    | None         |    Low        |    High       | None          | Low value select  |  High value   |

There are theoretically other cases where both have minimums that are present that have to be resolved. These are exceedingly 
rare in reality and should be implemented in future. There are also cases of maximums but these are usally simple in formuation
and again tests and example data have not been generated

TODO: in future run cases where both have min and max and where both are max Right now chooses max of mins and min of maxes. 
This may lead to issues in cases where the min of maxes is below the max of mins. Would need to check what the theoretical 
framework is in the thesis. No guarantee that mémoire took into consideration all of the cases

"""

def test_min_left_smaller_min_right_most_const_or():
    """
    # test_min_left_smaller_min_right_most_const_or
    Tests the most constraining or function with the left inventory being
    smaller than the minimum in the right inventory. In this case the largest 
    of the two minimum parking requirements is selected for going forward
    """
    left_PI = IDS.generate_min_only_small_PI()
    right_PI = IDS.generate_min_only_large_PI()
    test_subject_1 = PI.subset_operation(left_PI,3,right_PI)
    expected_result= IDS.generate_mco_left_small_min_expected_result()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)

def test_min_left_larger_min_right_most_const_or():
    """
    # test_min_left_larger_min_right_most_const_or
    Tests the most constraining or function in the case of two mins with the minimum on the
    left being larger than the mimimum on the right. In this case, the larger of the two 
    minimum parking requirements should be selected
    """
    left_PI = IDS.generate_min_only_large_PI()
    right_PI = IDS.generate_min_only_small_PI()
    test_subject_1 = PI.subset_operation(left_PI,3,right_PI)
    expected_result= IDS.generate_mco_right_small_min_expected_result()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)

def test_max_left_smaller_min_right_most_const_or():
    """
    # test_max_left_smaller_min_right_most_const_or
    Tests most constraining or function in the case where the left inventory contains only maxes and 
    the right inventory contains only minimums and the maxes are smaller than the mins. The expected 
    result is that the minimums will be capped to the maximum value set in this case
    """
    left_PI = IDS.generate_max_only_small_PI()
    right_PI = IDS.generate_min_only_large_PI()
    test_subject_1 = PI.subset_operation(left_PI,3,right_PI)
    expected_result= IDS.generate_mco_left_small_max_w_min_expected_result()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)

def test_max_left_larger_min_right_most_const_or():
    """
    # test_max_left_larger_min_right_most_const_or
    Tests most constraining or function int the case where the left inventory is a max and the right 
    inventory is a minimum and the max is larger leading to carrying oc
    """
    left_PI = IDS.generate_max_only_large_PI()
    right_PI = IDS.generate_min_only_small_PI()
    test_subject_1 = PI.subset_operation(left_PI,3,right_PI)
    expected_result = IDS.generate_mco_right_small_min_w_large_max_expected_result()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)

def test_min_left_smaller_max_right_most_const_or():
    """
    # test_min_left_smaller_max_right_most_const_or
    Tests the case where the left inventory is only mins and the right 
    inventory is a maximum and the minimum is smaller than the maximum value
    leading to carrying over the minimums and maximums to the new ParkingInventory
    """
    left_PI = IDS.generate_min_only_small_PI()
    right_PI = IDS.generate_max_only_large_PI()
    test_subject_1 = PI.subset_operation(left_PI,3,right_PI)
    expected_result = IDS.generate_mco_left_small_min_w_max_expected_result()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)

def test_min_left_larger_max_right_most_const_or():
    """
    # test_min_left_larger_max_right_most_const_or
    Tests the most constraining or functionality. This particular case is when the left is a minimum
    and the right is a maximum and the left values are larger than the right values. This leads to the
    minimum parking requirements being capped to the maximum value
    """
    left_PI = IDS.generate_min_only_large_PI()
    right_PI = IDS.generate_max_only_small_PI()
    test_subject_1 = PI.subset_operation(left_PI,3,right_PI)
    expected_result= IDS.generate_mco_left_large_min_w_max_expected_result()
    pd.testing.assert_frame_equal(test_subject_1.parking_frame,expected_result.parking_frame)