package com.inventory.stress;

import org.apache.jmeter.config.Arguments;
import org.apache.jmeter.config.gui.ArgumentsPanel;
import org.apache.jmeter.control.LoopController;
import org.apache.jmeter.control.gui.LoopControlPanel;
import org.apache.jmeter.engine.StandardJMeterEngine;
import org.apache.jmeter.protocol.http.control.Header;
import org.apache.jmeter.protocol.http.control.gui.HttpTestSampleGui;
import org.apache.jmeter.protocol.http.sampler.HTTPSampler;
import org.apache.jmeter.reporters.ResultCollector;
import org.apache.jmeter.reporters.Summariser;
import org.apache.jmeter.save.SaveService;
import org.apache.jmeter.testelement.TestElement;
import org.apache.jmeter.testelement.TestPlan;
import org.apache.jmeter.threads.ThreadGroup;
import org.apache.jmeter.threads.gui.ThreadGroupGui;
import org.apache.jmeter.util.JMeterUtils;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.apache.jorphan.collections.HashTree;
import org.apache.jmeter.protocol.http.control.HeaderManager;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.apache.jorphan.collections.ListedHashTree; // Add this import

import java.io.File;
import java.io.FileOutputStream;

public class InventoryStressTest extends StressTestBase {

    private static StandardJMeterEngine jmeterEngine;

    @LocalServerPort
    private int port;

    @BeforeAll
    static void setup() {
        // Inicializar JMeter
        JMeterUtils.setJMeterHome("src/test/resources/jmeter");
        JMeterUtils.loadJMeterProperties("src/test/resources/jmeter/jmeter.properties");
        JMeterUtils.initLocale();

        jmeterEngine = new StandardJMeterEngine();
        startApplication();
    }

    @AfterAll
    static void tearDown() {
        stopApplication();
    }

    @Test
    void testProductEndpointStress() throws Exception {
        // 1. Crear Test Plan
        TestPlan testPlan = new TestPlan("Inventory Stress Test");
        testPlan.setProperty(TestElement.TEST_CLASS, TestPlan.class.getName());
        testPlan.setProperty(TestElement.GUI_CLASS, "org.apache.jmeter.control.gui.TestPlanGui");

        // 2. Crear Thread Group
        ThreadGroup threadGroup = new ThreadGroup();
        threadGroup.setName("Product API Thread Group");
        threadGroup.setNumThreads(50); // 50 usuarios concurrentes
        threadGroup.setRampUp(10); // 10 segundos de rampa
        threadGroup.setProperty(TestElement.TEST_CLASS, ThreadGroup.class.getName());
        threadGroup.setProperty(TestElement.GUI_CLASS, ThreadGroupGui.class.getName());

        // 3. Crear Loop Controller
        LoopController loopController = new LoopController();
        loopController.setLoops(10); // 10 iteraciones por usuario
        loopController.setProperty(TestElement.TEST_CLASS, LoopController.class.getName());
        loopController.setProperty(TestElement.GUI_CLASS, LoopControlPanel.class.getName());
        threadGroup.setSamplerController(loopController);

        // 4. Crear HTTP Request para GET Products
        HTTPSampler httpSampler = new HTTPSampler();
        httpSampler.setDomain("localhost");
        httpSampler.setPort(port); // Use the injected port
        httpSampler.setPath("/api/v2/products");
        httpSampler.setMethod("GET");
        httpSampler.setName("GET All Products");
        httpSampler.setProperty(TestElement.TEST_CLASS, HTTPSampler.class.getName());
        httpSampler.setProperty(TestElement.GUI_CLASS, HttpTestSampleGui.class.getName());

        // 5. Configurar reporte
        Summariser summer = new Summariser("Summary");
        ResultCollector logger = new ResultCollector(summer);
        logger.setFilename("target/jmeter-results.jtl");

        // 6. Ensamblar el test
        ListedHashTree testPlanTree = new ListedHashTree(); // Use ListedHashTree
        testPlanTree.add(testPlan);
        ListedHashTree threadGroupHashTree = testPlanTree.add(threadGroup);
        threadGroupHashTree.add(httpSampler);
        threadGroupHashTree.add(logger);

        // 7. Ejecutar
        jmeterEngine.configure(testPlanTree);
        jmeterEngine.run();

        Thread.sleep(30000); // Esperar a que termine
        System.out.println("Stress test completed. Check target/jmeter-results.jtl for results");
    }

    @Test
    void testConcurrentProductCreation() throws Exception {
        // Test específico para creación concurrente de productos
        TestPlan testPlan = new TestPlan("Product Creation Stress Test");
        testPlan.setProperty(TestElement.TEST_CLASS, TestPlan.class.getName());
        testPlan.setProperty(TestElement.GUI_CLASS, "org.apache.jmeter.control.gui.TestPlanGui");

        ThreadGroup threadGroup = new ThreadGroup();
        threadGroup.setName("Product Creation Thread Group");
        threadGroup.setNumThreads(20); // 20 usuarios
        threadGroup.setRampUp(5); // 5 segundos
        threadGroup.setProperty(TestElement.TEST_CLASS, ThreadGroup.class.getName());
        threadGroup.setProperty(TestElement.GUI_CLASS, ThreadGroupGui.class.getName());

        LoopController loopController = new LoopController();
        loopController.setLoops(5); // 5 productos por usuario
        loopController.setProperty(TestElement.TEST_CLASS, LoopController.class.getName());
        loopController.setProperty(TestElement.GUI_CLASS, LoopControlPanel.class.getName());
        threadGroup.setSamplerController(loopController);

        // POST Request con datos JSON
        HTTPSampler postSampler = new HTTPSampler();
        postSampler.setDomain("localhost");
        postSampler.setPort(port); // Use the injected port
        postSampler.setPath("/api/v2/products");
        postSampler.setMethod("POST");
        postSampler.addNonEncodedArgument("",
                "{\n" +
                        "  \"name\": \"Stress Product ${__threadNum}-${__counter}\",\n" +
                        "  \"description\": \"Created during stress test\",\n" +
                        "  \"category\": \"Test\",\n" +
                        "  \"price\": ${__Random(10,100)},\n" +
                        "  \"initialQuantity\": ${__Random(1,50)},\n" +
                        "  \"minimumStock\": 5\n" +
                        "}", "");
        postSampler.setPostBodyRaw(true);
        postSampler.setName("Create Product");

        // Set HeaderManager before adding headers
        HeaderManager headerManager = new HeaderManager();
        headerManager.add(new Header("Content-Type", "application/json"));
        postSampler.setHeaderManager(headerManager);

        // Remove the incorrect line: postSampler.getHeaderManager().add();

        // Configurar reporte
        Summariser summer = new Summariser("Creation Summary");
        ResultCollector logger = new ResultCollector(summer);
        logger.setFilename("target/creation-stress-results.jtl");

        // Ensamblar el test
        ListedHashTree testPlanTree = new ListedHashTree(); // Use ListedHashTree
        testPlanTree.add(testPlan);
        ListedHashTree threadGroupHashTree = testPlanTree.add(threadGroup);
        threadGroupHashTree.add(postSampler);
        threadGroupHashTree.add(logger);

        // Ejecutar
        jmeterEngine.configure(testPlanTree);
        jmeterEngine.run();

        Thread.sleep(20000);
        System.out.println("Product creation stress test completed");
    }
}