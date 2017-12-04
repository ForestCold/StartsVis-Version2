/**
 * This Source Code Form is subject to the terms of the Mozilla Public License,
 * v. 2.0. If a copy of the MPL was not distributed with this file, You can
 * obtain one at http://mozilla.org/MPL/2.0/. OpenMRS is also distributed under
 * the terms of the Healthcare Disclaimer located at http://openmrs.org/license.
 *
 * Copyright (C) OpenMRS Inc. OpenMRS is a registered trademark and the OpenMRS
 * graphic logo is a trademark of OpenMRS Inc.
 */
package org.openmrs.api;

import static org.hamcrest.CoreMatchers.is;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertNull;
import static org.junit.Assert.assertThat;
import static org.junit.Assert.assertTrue;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.Set;

import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.openmrs.Concept;
import org.openmrs.ConceptName;
import org.openmrs.ConceptStateConversion;
import org.openmrs.Patient;
import org.openmrs.PatientProgram;
import org.openmrs.PatientState;
import org.openmrs.Program;
import org.openmrs.ProgramWorkflow;
import org.openmrs.ProgramWorkflowState;
import org.openmrs.User;
import org.openmrs.api.context.Context;
import org.openmrs.test.BaseContextSensitiveTest;
import org.openmrs.test.TestUtil;

/**
 * This class tests methods in the PatientService class TODO Add methods to test all methods in
 * PatientService class
 */
public class ProgramWorkflowServiceTest extends BaseContextSensitiveTest {
	
	protected static final String CREATE_PATIENT_PROGRAMS_XML = "org/openmrs/api/include/ProgramWorkflowServiceTest-createPatientProgram.xml";
	
	protected static final String PROGRAM_WITH_OUTCOMES_XML = "org/openmrs/api/include/ProgramWorkflowServiceTest-initialData.xml";
	
	protected ProgramWorkflowService pws = null;
	
	protected AdministrationService adminService = null;
	
	protected EncounterService encounterService = null;
	
	protected ConceptService cs = null;
	
	@Before
	public void runBeforeEachTest() {
		executeDataSet(CREATE_PATIENT_PROGRAMS_XML);
		
		if (pws == null) {
			pws = Context.getProgramWorkflowService();
			adminService = Context.getAdministrationService();
			encounterService = Context.getEncounterService();
			cs = Context.getConceptService();
		}
	}
	
	/**
	 * Tests fetching a PatientProgram, updating and saving it, and subsequently fetching the
	 * updated value. To use in MySQL database: Uncomment method useInMemoryDatabase() and comment
	 * out call to initializeInMemoryDatabase() and executeDataSet() within onSetupTransaction() .
	 * 
	 * @see ProgramWorkflowService#savePatientProgram(PatientProgram)
	 */
	@Test
	public void savePatientProgram_shouldUpdatePatientProgram() {
		
		Date today = new Date();
		
		PatientProgram patientProgram = pws.getPatientProgram(1);
		Date dateCompleted = patientProgram.getDateCompleted();
		Date dateChanged = patientProgram.getDateChanged();
		User changedBy = patientProgram.getChangedBy();
		if (null != dateCompleted) {
			//System.out.println("Date Completed: " + dateCompleted);
		}
		if (null != dateChanged) {
			//System.out.println("Date Changed: " + dateChanged);
		}
		if (null != changedBy) {
			//System.out.println("Changed By: " + changedBy.toString());
		}
		
		patientProgram.setDateCompleted(today);
		patientProgram.setChangedBy(Context.getAuthenticatedUser());
		patientProgram.setDateChanged(today);
		pws.savePatientProgram(patientProgram);
		
		// Uncomment to commit to database
		// setComplete( );
		
		PatientProgram ptProg = pws.getPatientProgram(1);
		Date dateCompleted2 = patientProgram.getDateCompleted();
		Date dateChanged2 = patientProgram.getDateChanged();
		User changedBy2 = patientProgram.getChangedBy();
		
		if (null != dateCompleted2) {
			//System.out.println("Date Completed: " + dateCompleted2);
		}
		if (null != dateChanged2) {
			//System.out.println("Date Changed: " + dateChanged2);
		}
		if (null != changedBy2) {
			//System.out.println("Changed By: " + changedBy2.toString());
		}
		
		assertNotNull(ptProg.getDateCompleted());
		assertEquals(today, ptProg.getDateCompleted());
		
	}
	
	/**
	 * Tests creating a new program containing workflows and states
	 * 
	 * @see ProgramWorkflowService#saveProgram(Program)
	 */
	@Test
	public void saveProgram_shouldCreateProgramWorkflows() {
		
		int numBefore = Context.getProgramWorkflowService().getAllPrograms().size();
		
		Program program = new Program();
		program.setName("TEST PROGRAM");
		program.setDescription("TEST PROGRAM DESCRIPTION");
		program.setConcept(cs.getConcept(3));
		
		ProgramWorkflow workflow = new ProgramWorkflow();
		workflow.setConcept(cs.getConcept(4));
		program.addWorkflow(workflow);
		
		ProgramWorkflowState state1 = new ProgramWorkflowState();
		state1.setConcept(cs.getConcept(5));
		state1.setInitial(true);
		state1.setTerminal(false);
		workflow.addState(state1);
		
		ProgramWorkflowState state2 = new ProgramWorkflowState();
		state2.setConcept(cs.getConcept(6));
		state2.setInitial(false);
		state2.setTerminal(true);
		workflow.addState(state2);
		
		Context.getProgramWorkflowService().saveProgram(program);
		
		assertEquals("Failed to create program", numBefore + 1, Context.getProgramWorkflowService().getAllPrograms().size());
		Program p = Context.getProgramWorkflowService().getProgramByName("TEST PROGRAM");
		assertNotNull("Program is null", p);
		assertNotNull("Workflows is null", p.getWorkflows());
		assertEquals("Wrong number of workflows", 1, p.getWorkflows().size());
		
		ProgramWorkflow wf = p.getWorkflowByName("CIVIL STATUS");
		assertNotNull(wf);
		
		List<String> names = new ArrayList<>();
		for (ProgramWorkflowState s : wf.getStates()) {
			names.add(s.getConcept().getName().getName());
		}
		TestUtil.assertCollectionContentsEquals(Arrays.asList(new String[] { "SINGLE", "MARRIED" }), names);
	}
	
	/**
	 * @see ProgramWorkflowService#getConceptStateConversionByUuid(String)
	 */
	@Test
	public void getConceptStateConversionByUuid_shouldFindObjectGivenValidUuid() {
		String uuid = "6c72b064-506d-11de-80cb-001e378eb67e";
		ConceptStateConversion conceptStateConversion = Context.getProgramWorkflowService().getConceptStateConversionByUuid(
		    uuid);
		Assert.assertEquals(1, (int) conceptStateConversion.getConceptStateConversionId());
	}
	
	/**
	 * @see ProgramWorkflowService#getConceptStateConversionByUuid(String)
	 */
	@Test
	public void getConceptStateConversionByUuid_shouldReturnNullIfNoObjectFoundWithGivenUuid() {
		Assert.assertNull(Context.getProgramWorkflowService().getConceptStateConversionByUuid("some invalid uuid"));
	}
	
	/**
	 * @see ProgramWorkflowService#getPatientProgramByUuid(String)
	 */
	@Test
	public void getPatientProgramByUuid_shouldFindObjectGivenValidUuid() {
		String uuid = "2edf272c-bf05-4208-9f93-2fa213ed0415";
		PatientProgram patientProgram = Context.getProgramWorkflowService().getPatientProgramByUuid(uuid);
		Assert.assertEquals(2, (int) patientProgram.getPatientProgramId());
	}
	
	/**
	 * @see ProgramWorkflowService#getPatientProgramByUuid(String)
	 */
	@Test
	public void getPatientProgramByUuid_shouldReturnNullIfNoObjectFoundWithGivenUuid() {
		Assert.assertNull(Context.getProgramWorkflowService().getPatientProgramByUuid("some invalid uuid"));
	}
	
	/**
	 * @see ProgramWorkflowService#getPatientStateByUuid(String)
	 */
	@Test
	public void getPatientStateByUuid_shouldFindObjectGivenValidUuid() {
		String uuid = "ea89deaa-23cc-4840-92fe-63d199c37e4c";
		PatientState patientState = Context.getProgramWorkflowService().getPatientStateByUuid(uuid);
		Assert.assertEquals(1, (int) patientState.getPatientStateId());
	}
	
	/**
	 * @see ProgramWorkflowService#getPatientStateByUuid(String)
	 */
	@Test
	public void getPatientStateByUuid_shouldReturnNullIfNoObjectFoundWithGivenUuid() {
		Assert.assertNull(Context.getProgramWorkflowService().getPatientStateByUuid("some invalid uuid"));
	}
	
	/**
	 * @see ProgramWorkflowService#getProgramByUuid(String)
	 */
	@Test
	public void getProgramByUuid_shouldFindObjectGivenValidUuid() {
		String uuid = "eae98b4c-e195-403b-b34a-82d94103b2c0";
		Program program = Context.getProgramWorkflowService().getProgramByUuid(uuid);
		Assert.assertEquals(1, (int) program.getProgramId());
	}
	
	/**
	 * @see ProgramWorkflowService#getProgramByUuid(String)
	 */
	@Test
	public void getProgramByUuid_shouldReturnNullIfNoObjectFoundWithGivenUuid() {
		Assert.assertNull(Context.getProgramWorkflowService().getProgramByUuid("some invalid uuid"));
	}
	
	@Test
	public void getState_shouldGetStateAssociatedWithGivenIdIfWorkflowStateIdExists() {
		
		final Integer EXISTING_WORKFLOW_STATE_ID = 1;
		
		ProgramWorkflowState state = pws.getState(EXISTING_WORKFLOW_STATE_ID);
		
		assertNotNull("ProgramWorkflowState not found", state);
		assertThat(state.getId(), is(EXISTING_WORKFLOW_STATE_ID));
	}
	
	@Test
	public void getState_shouldReturnNullIfGivenWorkflowStateIdDoesNotExists() {
		
		assertNull(pws.getState(99999));
	}
	
	/**
	 * @see ProgramWorkflowService#getStateByUuid(String)
	 */
	@Test
	public void getStateByUuid_shouldFindObjectGivenValidUuid() {
		String uuid = "92584cdc-6a20-4c84-a659-e035e45d36b0";
		ProgramWorkflowState state = Context.getProgramWorkflowService().getStateByUuid(uuid);
		Assert.assertEquals(1, (int) state.getProgramWorkflowStateId());
	}
	
	/**
	 * @see ProgramWorkflowService#getStateByUuid(String)
	 */
	@Test
	public void getStateByUuid_shouldReturnNullIfNoObjectFoundWithGivenUuid() {
		Assert.assertNull(Context.getProgramWorkflowService().getStateByUuid("some invalid uuid"));
	}
	
	@Test
	public void getWorkflow_shouldGetWorkflowAssociatedWithGivenIdIfWorkflowIdExists() {
		
		final Integer EXISTING_WORKFLOW_ID = 1;
		
		ProgramWorkflow workflow = pws.getWorkflow(EXISTING_WORKFLOW_ID);
		
		assertNotNull("ProgramWorkflow not found", workflow);
		assertThat(workflow.getId(), is(EXISTING_WORKFLOW_ID));
	}
	
	@Test
	public void getWorkflow_shouldReturnNullIfGivenWorkflowIdDoesNotExists() {
		
		assertNull(pws.getWorkflow(99999));
	}
	
	/**
	 * @see ProgramWorkflowService#getWorkflowByUuid(String)
	 */
	@Test
	public void getWorkflowByUuid_shouldFindObjectGivenValidUuid() {
		String uuid = "84f0effa-dd73-46cb-b931-7cd6be6c5f81";
		ProgramWorkflow programWorkflow = Context.getProgramWorkflowService().getWorkflowByUuid(uuid);
		Assert.assertEquals(1, (int) programWorkflow.getProgramWorkflowId());
	}
	
	/**
	 * @see ProgramWorkflowService#getWorkflowByUuid(String)
	 */
	@Test
	public void getWorkflowByUuid_shouldReturnNullIfNoObjectFoundWithGivenUuid() {
		Assert.assertNull(Context.getProgramWorkflowService().getWorkflowByUuid("some invalid uuid"));
	}
	
	/**
	 * THIS TEST SHOULD BE IN THE CLASS 'PROGRAMWORKFLOWTEST.JAVA' BUT IT REQUIRES ACCESS TO THE DAO
	 * LAYER
	 * 
	 * @see ProgramWorkflow#getSortedStates()
	 */
	
	@Test
	public void getSortedStates_shouldSortNamesContainingNumbersIntelligently() {
		
		ProgramWorkflow program = new ProgramWorkflow();
		
		ConceptName state1ConceptName = new ConceptName("Group 10", Context.getLocale());
		Concept state1Concept = new Concept();
		state1Concept.addName(state1ConceptName);
		ProgramWorkflowState state1 = new ProgramWorkflowState();
		state1.setConcept(state1Concept);
		program.addState(state1);
		
		ConceptName state2ConceptName = new ConceptName("Group 2", Context.getLocale());
		Concept state2Concept = new Concept();
		state2Concept.addName(state2ConceptName);
		ProgramWorkflowState state2 = new ProgramWorkflowState();
		state2.setConcept(state2Concept);
		program.addState(state2);
		
		Set<ProgramWorkflowState> sortedStates = program.getSortedStates();
		int x = 1;
		for (ProgramWorkflowState state : sortedStates) {
			if (x == 1) {
				Assert.assertEquals("Group 2", state.getConcept().getName(Context.getLocale()).getName());
			} else if (x == 2) {
				Assert.assertEquals("Group 10", state.getConcept().getName(Context.getLocale()).getName());
			} else {
				Assert.fail("Wha?!");
			}
			x++;
		}
	}
	
	@Test
	public void getPossibleOutcomes_shouldGetOutcomesForASet() {
		executeDataSet(PROGRAM_WITH_OUTCOMES_XML);
		
		List<Concept> possibleOutcomes = Context.getProgramWorkflowService().getPossibleOutcomes(4);
		assertEquals(4, possibleOutcomes.size());
	}
	
	@Test
	public void getPossibleOutcomes_shouldGetOutcomesForAQuestion() {
		executeDataSet(PROGRAM_WITH_OUTCOMES_XML);
		
		List<Concept> possibleOutcomes = Context.getProgramWorkflowService().getPossibleOutcomes(5);
		assertEquals(2, possibleOutcomes.size());
	}
	
	@Test
	public void getPossibleOutcomes_shouldReturnEmptyListWhenNoProgramExists() {
		executeDataSet(PROGRAM_WITH_OUTCOMES_XML);
		
		List<Concept> possibleOutcomes = Context.getProgramWorkflowService().getPossibleOutcomes(999);
		assertTrue(possibleOutcomes.isEmpty());
	}
	
	@Test
	public void getPossibleOutcomes_shouldReturnEmptyListWhenProgramHasNoOutcome() {
		executeDataSet(PROGRAM_WITH_OUTCOMES_XML);
		
		List<Concept> possibleOutcomes = Context.getProgramWorkflowService().getPossibleOutcomes(1);
		assertTrue(possibleOutcomes.isEmpty());
	}
	
	/**
	 * @see ProgramWorkflowService#saveProgram(Program)
	 */
	@Test
	public void saveProgram_shouldUpdateDetachedProgram() {
		Program program = Context.getProgramWorkflowService().getProgramByUuid("eae98b4c-e195-403b-b34a-82d94103b2c0");
		program.setDescription("new description");
		Context.evictFromSession(program);
		
		program = Context.getProgramWorkflowService().saveProgram(program);
		Assert.assertEquals("new description", program.getDescription());
	}
	
	/**
	 * @throws InterruptedException
	 * @see ProgramWorkflowService#triggerStateConversion(Patient,Concept,Date)
	 */
	@Test
	public void triggerStateConversion_shouldSkipPastPatientProgramsThatAreAlreadyCompleted() throws InterruptedException {
		Integer patientProgramId = 1;
		PatientProgram pp = pws.getPatientProgram(patientProgramId);
		Date originalDateCompleted = new Date();
		pp.setDateCompleted(originalDateCompleted);
		pp = pws.savePatientProgram(pp);
		
		Concept diedConcept = cs.getConcept(16);
		//sanity check to ensure the patient died is a possible state in one of the work flows
		Assert.assertNotNull(pp.getProgram().getWorkflow(1).getState(diedConcept));
		
		Thread.sleep(10);//delay so that we have a time difference
		
		pp = pws.getPatientProgram(patientProgramId);
		Assert.assertEquals(originalDateCompleted, pp.getDateCompleted());
	}
	
	@Test
	public void getProgramByName_shouldReturnProgramWhenNameMatches() {
		Program p = pws.getProgramByName("program name");
		assertNotNull(p);
	}
	
	@Test
	public void getProgramByName_shouldReturnNullWhenNoProgramForGivenName() {
		Program p = pws.getProgramByName("unexisting program");
		assertNull(p);
	}
	
	@Test
	public void retireProgram_shouldSaveTheRetiredProgramWithReason() throws APIException {
		String reason = "Feeling well.";
		
		String uuid = "eae98b4c-e195-403b-b34a-82d94103b2c0";
		Program program = Context.getProgramWorkflowService().getProgramByUuid(uuid);
		
		Program retireProgram = pws.retireProgram(program, reason);
		
		assertTrue(retireProgram.getRetired());
		assertEquals(reason, retireProgram.getRetireReason());
		for (ProgramWorkflow programWorkflow : program.getAllWorkflows()) {
			assertTrue(programWorkflow.getRetired());
			for (ProgramWorkflowState programWorkflowState : programWorkflow.getStates()) {
				assertTrue(programWorkflowState.getRetired());
			}
		}
		
	}
	
	@Test
	public void purgeProgram_shouldPurgeProgramWithPatientsEnrolled() {
		Program program = Context.getProgramWorkflowService().getProgram(2);
		
		// program has at least one patient enrolled
		List<PatientProgram> patientPrograms = Context.getProgramWorkflowService().getPatientPrograms(null, program, null,
		    null, null, null, true);
		assertTrue(patientPrograms.size() > 0);
		
		Context.getProgramWorkflowService().purgeProgram(program);
		
		// should cascade to patient programs
		for (PatientProgram patientProgram : patientPrograms) {
			assertNull(Context.getProgramWorkflowService().getPatientProgram(patientProgram.getId()));
		}
		// make sure that the program was deleted properly
		assertNull(Context.getProgramWorkflowService().getProgram(2));
	}
	
	//	/**
	//	 * This method should be uncommented when you want to examine the actual hibernate
	//	 * sql calls being made.  The calls that should be limiting the number of returned
	//	 * patients should show a "top" or "limit" in the sql -- this proves hibernate's
	//	 * use of a native sql limit as opposed to a java-only limit.
	//	 *
	//	 * Note: if enabled, this test will be considerably slower
	//     *
	//     * @see org.openmrs.test.BaseContextSensitiveTest#getRuntimeProperties()
	//     */
	//    @Override
	//    public Properties getRuntimeProperties() {
	//	    Properties props = super.getRuntimeProperties();
	//	    props.setProperty("hibernate.show_sql", "true");
	//
	//    	return props;
	//    }
	
}
