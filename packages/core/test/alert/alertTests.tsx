/*
 * Copyright 2015 Palantir Technologies, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { assert } from "chai";
import { mount, shallow, type ShallowWrapper } from "enzyme";
import * as React from "react";
import { type SinonStub, spy, stub } from "sinon";

import { WarningSign } from "@blueprintjs/icons";

import { Alert, type AlertProps, Button, type ButtonProps, Classes, Icon, Intent } from "../../src";
import * as Errors from "../../src/common/errors";
import { findInPortal } from "../utils";

describe("<Alert>", () => {
    let testsContainerElement: HTMLElement | undefined;

    beforeEach(() => {
        testsContainerElement = document.createElement("div");
        document.body.appendChild(testsContainerElement);
    });

    afterEach(() => {
        testsContainerElement?.remove();
    });

    it("renders its content correctly", () => {
        const noop = () => true;
        const wrapper = shallow(
            <Alert
                className="test-class"
                isOpen={true}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
                onClose={noop}
            >
                <p>Are you sure you want to delete this file?</p>
                <p>There is no going back.</p>
            </Alert>,
        );

        assert.lengthOf(wrapper.find(`.${Classes.ALERT}.test-class`), 1);
        assert.lengthOf(wrapper.find(`.${Classes.ALERT_BODY}`), 1);
        assert.lengthOf(wrapper.find(`.${Classes.ALERT_CONTENTS}`), 1);
        assert.lengthOf(wrapper.find(`.${Classes.ALERT_FOOTER}`), 1);
    });

    it("renders contents to specified container correctly", () => {
        const container = document.createElement("div");
        document.body.appendChild(container);
        mount(
            <Alert isOpen={true} portalContainer={container}>
                <p>Are you sure you want to delete this file?</p>
                <p>There is no going back.</p>
            </Alert>,
            { attachTo: testsContainerElement },
        );
        assert.lengthOf(container.getElementsByClassName(Classes.ALERT), 1);
        document.body.removeChild(container);
    });

    it("renders the icon correctly", () => {
        const wrapper = shallow(
            <Alert icon={<WarningSign />} isOpen={true} confirmButtonText="Delete">
                <p>Are you sure you want to delete this file?</p>
                <p>There is no going back.</p>
            </Alert>,
        );

        assert.lengthOf(wrapper.find(Icon), 1);
    });

    it("supports overlay lifecycle props", () => {
        const onOpening = spy();
        const wrapper = mount(
            <Alert isOpen={true} onOpening={onOpening}>
                Alert
                <p>Are you sure you want to delete this file?</p>
                <p>There is no going back.</p>
            </Alert>,
            { attachTo: testsContainerElement },
        );
        assert.isTrue(onOpening.calledOnce);
        wrapper.unmount();
    });

    describe("confirm button", () => {
        const onConfirm = spy();
        const onClose = spy();
        let wrapper: ShallowWrapper<AlertProps, any>;

        beforeEach(() => {
            onConfirm.resetHistory();
            onClose.resetHistory();
            wrapper = shallow(
                <Alert
                    icon={<WarningSign />}
                    intent={Intent.PRIMARY}
                    isOpen={true}
                    confirmButtonText="Delete"
                    onConfirm={onConfirm}
                    onClose={onClose}
                >
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
        });

        afterEach(() => wrapper.unmount());

        it("text is confirmButtonText", () => {
            assert.equal(wrapper.find(Button).prop("text"), "Delete");
        });

        it("intent inherited from prop", () => {
            assert.equal(wrapper.find(Button).prop("intent"), Intent.PRIMARY);
        });

        it("onConfirm and onClose triggered on click", () => {
            wrapper.find(Button).simulate("click");
            assert.isTrue(onConfirm.calledOnce);
            assert.isTrue(onClose.calledOnce);
            assert.strictEqual(onClose.args[0][0], true);
        });
    });

    describe("cancel button", () => {
        const onCancel = spy();
        const onClose = spy();
        let wrapper: ShallowWrapper<AlertProps, any>;
        let cancelButton: ShallowWrapper<ButtonProps, any>;

        beforeEach(() => {
            onCancel.resetHistory();
            onClose.resetHistory();
            wrapper = shallow(
                <Alert
                    icon={<WarningSign />}
                    intent={Intent.PRIMARY}
                    isOpen={true}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                    onCancel={onCancel}
                    onClose={onClose}
                >
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
            cancelButton = wrapper.find(Button).last();
        });

        afterEach(() => wrapper.unmount());

        it("text is cancelButtonText", () => {
            assert.equal(cancelButton.prop("text"), "Cancel");
        });

        it("intent is undefined", () => {
            assert.isUndefined(cancelButton.prop("intent"));
        });

        it("onCancel and onClose triggered on click", () => {
            cancelButton.simulate("click");
            assert.isTrue(onCancel.calledOnce);
            assert.isTrue(onClose.calledOnce);
            assert.strictEqual(onClose.args[0][0], false);
        });

        it("canEscapeKeyCancel enables escape key", () => {
            const alert = mount<AlertProps>(
                <Alert isOpen={true} cancelButtonText="Cancel" confirmButtonText="Delete" onCancel={onCancel}>
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
                { attachTo: testsContainerElement },
            );
            const overlay = findInPortal(alert, "." + Classes.OVERLAY).first();

            overlay.simulate("keydown", { key: "Escape" });
            assert.isTrue(onCancel.notCalled);

            alert.setProps({ canEscapeKeyCancel: true });
            overlay.simulate("keydown", { key: "Escape" });
            assert.isTrue(onCancel.calledOnce);

            alert.unmount();
        });

        it("canOutsideClickCancel enables outside click", () => {
            const alert = mount<AlertProps>(
                <Alert isOpen={true} cancelButtonText="Cancel" confirmButtonText="Delete" onCancel={onCancel}>
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
                { attachTo: testsContainerElement },
            );
            const backdrop = findInPortal(alert, "." + Classes.OVERLAY_BACKDROP).hostNodes();

            backdrop.simulate("mousedown");
            assert.isTrue(onCancel.notCalled);

            alert.setProps({ canOutsideClickCancel: true });
            backdrop.simulate("mousedown");
            assert.isTrue(onCancel.calledOnce);

            alert.unmount();
        });
    });

    describe("load state", () => {
        let wrapper: ShallowWrapper<AlertProps, any>;
        let findCancelButton: () => ShallowWrapper<ButtonProps, any>;
        let findSubmitButton: () => ShallowWrapper<ButtonProps, any>;

        beforeEach(() => {
            wrapper = shallow(
                <Alert
                    icon={<WarningSign />}
                    intent={Intent.PRIMARY}
                    isOpen={true}
                    loading={true}
                    cancelButtonText="Cancel"
                    confirmButtonText="Delete"
                >
                    <p>Are you sure you want to delete this file?</p>
                    <p>There is no going back.</p>
                </Alert>,
            );
            findSubmitButton = () => wrapper.find(Button).first();
            findCancelButton = () => wrapper.find(Button).last();
        });

        it("Properly displays buttons when set to loading", () => {
            assert.isTrue(findCancelButton().prop("disabled"));
            assert.isTrue(findSubmitButton().prop("loading"));
            wrapper.setProps({ loading: false });
            assert.isFalse(findCancelButton().prop("disabled"));
            assert.isFalse(findSubmitButton().prop("loading"));
        });
    });

    describe("warnings", () => {
        let warnSpy: SinonStub;
        before(() => (warnSpy = stub(console, "warn")));
        afterEach(() => warnSpy.resetHistory());
        after(() => warnSpy.restore());

        it("cancelButtonText without cancel handler", () => {
            testWarn(<Alert cancelButtonText="cancel" isOpen={false} />, Errors.ALERT_WARN_CANCEL_PROPS);
        });

        it("canEscapeKeyCancel without cancel handler", () => {
            testWarn(<Alert canEscapeKeyCancel={true} isOpen={false} />, Errors.ALERT_WARN_CANCEL_ESCAPE_KEY);
        });

        it("canOutsideClickCancel without cancel handler", () => {
            testWarn(<Alert canOutsideClickCancel={true} isOpen={false} />, Errors.ALERT_WARN_CANCEL_OUTSIDE_CLICK);
        });

        function testWarn(alert: JSX.Element, warning: string) {
            // one warning
            const wrapper = shallow(alert);
            assert.strictEqual(warnSpy.callCount, 1);
            assert.isTrue(warnSpy.calledWithExactly(warning));
            // no more warnings
            wrapper
                .setProps({ onClose: () => true })
                .setProps({ cancelButtonText: "cancel", onCancel: () => true, onClose: undefined });
            assert.strictEqual(warnSpy.callCount, 1);
        }
    });
});
